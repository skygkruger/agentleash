// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT API SERVER
// Express.js + TypeScript + Supabase
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ───────────────────────────────────────────────────────────────
// MIDDLEWARE
// ───────────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ───────────────────────────────────────────────────────────────
// HEALTH CHECK
// ───────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'scopeagent-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ───────────────────────────────────────────────────────────────
// API ROUTES (to be implemented in Phase 3)
// ───────────────────────────────────────────────────────────────

app.get('/api', (_req, res) => {
  res.json({
    message: 'ScopeAgent API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      scopes: '/api/scopes',
      rules: '/api/scopes/:scopeId/rules',
      logs: '/api/scopes/:scopeId/logs',
      violations: '/api/scopes/:scopeId/violations',
    },
  });
});

// Placeholder routes
app.use('/api/auth', (_req, res) => {
  res.json({ message: 'Auth routes - coming in Phase 3' });
});

app.use('/api/scopes', (_req, res) => {
  res.json({ message: 'Scopes routes - coming in Phase 3' });
});

// ───────────────────────────────────────────────────────────────
// ERROR HANDLING
// ───────────────────────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// ───────────────────────────────────────────────────────────────
// HTTP + WEBSOCKET SERVER
// ───────────────────────────────────────────────────────────────

const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('[WS] Received:', data);

      // Handle subscription requests
      if (data.type === 'subscribe') {
        ws.send(
          JSON.stringify({
            type: 'subscribed',
            scopeId: data.scopeId,
          })
        );
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'connected',
      message: 'Connected to ScopeAgent API',
    })
  );
});

// ───────────────────────────────────────────────────────────────
// START SERVER
// ───────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT API                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Server:    http://localhost:${PORT}                                            ║
║  WebSocket: ws://localhost:${PORT}/ws                                           ║
║  Health:    http://localhost:${PORT}/health                                     ║
║                                                                              ║
║  Status:    [*] RUNNING                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `);
});

export { app, server, wss };
