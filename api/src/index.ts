// ═══════════════════════════════════════════════════════════════
// AGENTLEASH API SERVER
// Express.js + TypeScript + Supabase + WebSocket
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import scopesRoutes from './routes/scopes';
import rulesRoutes from './routes/rules';
import logsRoutes from './routes/logs';
import violationsRoutes from './routes/violations';
import bundlesRoutes, { handleStripeWebhook } from './routes/bundles';

// Import WebSocket handler
import { WSHandler } from './ws/handler';

// Import database
import { checkConnection } from './db/supabase';

// ───────────────────────────────────────────────────────────────
// APP SETUP
// ───────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`[Startup] PORT=${PORT}, NODE_ENV=${process.env.NODE_ENV}`);

// ───────────────────────────────────────────────────────────────
// MIDDLEWARE
// ───────────────────────────────────────────────────────────────

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for API
  })
);

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter limit for auth endpoints
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
});

// ───────────────────────────────────────────────────────────────
// STRIPE WEBHOOK (before JSON middleware - needs raw body)
// ───────────────────────────────────────────────────────────────

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    const result = await handleStripeWebhook(req.body, signature);

    if (result.received) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  }
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ───────────────────────────────────────────────────────────────
// HEALTH CHECK
// ───────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  // Respond immediately for Railway healthcheck
  res.json({
    status: 'ok',
    service: 'scopeagent-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check with DB status
app.get('/health/detailed', async (_req, res) => {
  const dbConnected = await checkConnection();
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    service: 'scopeagent-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// ───────────────────────────────────────────────────────────────
// API INFO
// ───────────────────────────────────────────────────────────────

app.get('/api', (_req, res) => {
  res.json({
    name: 'ScopeAgent API',
    version: '1.0.0',
    description: 'AI Agent Permission Controller API',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        apiKeys: 'GET /api/auth/api-keys',
        createApiKey: 'POST /api/auth/api-key',
      },
      scopes: {
        list: 'GET /api/scopes',
        create: 'POST /api/scopes',
        get: 'GET /api/scopes/:id',
        update: 'PUT /api/scopes/:id',
        delete: 'DELETE /api/scopes/:id',
        sync: 'POST /api/scopes/:id/sync',
        export: 'GET /api/scopes/:id/export',
      },
      rules: {
        list: 'GET /api/scopes/:scopeId/rules',
        create: 'POST /api/scopes/:scopeId/rules',
        update: 'PUT /api/scopes/:scopeId/rules/:ruleId',
        delete: 'DELETE /api/scopes/:scopeId/rules/:ruleId',
        test: 'POST /api/scopes/:scopeId/rules/test',
        bulk: 'POST /api/scopes/:scopeId/rules/bulk',
      },
      logs: {
        list: 'GET /api/scopes/:scopeId/logs',
        stats: 'GET /api/scopes/:scopeId/logs/stats',
        export: 'GET /api/scopes/:scopeId/logs/export',
        create: 'POST /api/scopes/:scopeId/logs',
      },
      violations: {
        list: 'GET /api/scopes/:scopeId/violations',
        summary: 'GET /api/scopes/:scopeId/violations/summary',
        get: 'GET /api/scopes/:scopeId/violations/:id',
        acknowledge: 'POST /api/scopes/:scopeId/violations/:id/acknowledge',
        create: 'POST /api/scopes/:scopeId/violations',
      },
      bundles: {
        list: 'GET /api/bundles',
        get: 'GET /api/bundles/:id',
        subscribe: 'POST /api/bundles/subscribe',
        upgradeOptions: 'GET /api/bundles/upgrade/options',
        upgrade: 'POST /api/bundles/upgrade',
        status: 'GET /api/bundles/status',
        cancel: 'POST /api/bundles/cancel',
        webhook: 'POST /api/webhooks/stripe (Stripe webhook endpoint)',
      },
    },
    websocket: {
      url: `ws://localhost:${PORT}/ws`,
      protocol: {
        subscribe: '{ type: "subscribe", scopeId: "uuid", token: "jwt" }',
        unsubscribe: '{ type: "unsubscribe" }',
        events: ['access', 'violation', 'stats'],
      },
    },
  });
});

// ───────────────────────────────────────────────────────────────
// API ROUTES
// ───────────────────────────────────────────────────────────────

// Apply rate limiters
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/scopes', scopesRoutes);
app.use('/api/scopes/:scopeId/rules', rulesRoutes);
app.use('/api/scopes/:scopeId/logs', logsRoutes);
app.use('/api/scopes/:scopeId/violations', violationsRoutes);
app.use('/api/bundles', bundlesRoutes);

// ───────────────────────────────────────────────────────────────
// ERROR HANDLING
// ───────────────────────────────────────────────────────────────

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[ERROR]', err.message);
    console.error(err.stack);

    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
      res.status(403).json({
        success: false,
        error: 'CORS policy violation',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    });
  }
);

// ───────────────────────────────────────────────────────────────
// HTTP + WEBSOCKET SERVER
// ───────────────────────────────────────────────────────────────

const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
const wsHandler = new WSHandler(wss);

// Export for use in routes (to broadcast events)
export { wsHandler };

// ───────────────────────────────────────────────────────────────
// START SERVER
// ───────────────────────────────────────────────────────────────

server.listen(Number(PORT), '0.0.0.0', async () => {
  // Check database connection
  const dbConnected = await checkConnection();

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT API                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Server:    http://localhost:${String(PORT).padEnd(5)}                                          ║
║  WebSocket: ws://localhost:${String(PORT).padEnd(5)}/ws                                         ║
║  Health:    http://localhost:${String(PORT).padEnd(5)}/health                                   ║
║  API Docs:  http://localhost:${String(PORT).padEnd(5)}/api                                      ║
║                                                                              ║
║  Database:  ${dbConnected ? '[/] Connected' : '[X] Disconnected'}                                              ║
║  Status:    [*] RUNNING                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
});

// ───────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ───────────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n[*] Shutting down...');
  wsHandler.shutdown();
  server.close(() => {
    console.log('[*] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  wsHandler.shutdown();
  server.close(() => {
    process.exit(0);
  });
});

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export { app, server, wss };
