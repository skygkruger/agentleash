// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT WEBSOCKET HANDLER
// Real-time updates for dashboard
// ═══════════════════════════════════════════════════════════════

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken, AuthUser } from '../middleware/auth';
import { supabaseAdmin } from '../db/supabase';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

interface WSClient {
  ws: WebSocket;
  user: AuthUser | null;
  scopeId: string | null;
  isAuthenticated: boolean;
  lastPing: number;
}

interface WSMessage {
  type: string;
  data?: unknown;
  scopeId?: string;
  token?: string;
}

interface AccessEventData {
  id: string;
  filePath: string;
  operation: string;
  result: 'allowed' | 'blocked' | 'warning';
  timestamp: string;
  agentIdentifier?: string;
}

interface ViolationEventData {
  id: string;
  severity: string;
  type: string;
  description: string;
  timestamp: string;
}

interface StatsData {
  activeOperations: number;
  blockedToday: number;
  totalToday: number;
}

// ───────────────────────────────────────────────────────────────
// WEBSOCKET HANDLER CLASS
// ───────────────────────────────────────────────────────────────

export class WSHandler {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, WSClient> = new Map();
  private scopeSubscribers: Map<string, Set<WebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupServer();
    this.startHeartbeat();
  }

  // ─────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('[WS] Client connected');

      // Initialize client
      const client: WSClient = {
        ws,
        user: null,
        scopeId: null,
        isAuthenticated: false,
        lastPing: Date.now(),
      };
      this.clients.set(ws, client);

      // Handle messages
      ws.on('message', (data) => {
        this.handleMessage(ws, data.toString());
      });

      // Handle close
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('[WS] Client error:', error);
        this.handleDisconnect(ws);
      });

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        data: { message: 'Connected to ScopeAgent WebSocket' },
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MESSAGE HANDLING
  // ─────────────────────────────────────────────────────────────

  private async handleMessage(ws: WebSocket, rawData: string): Promise<void> {
    let message: WSMessage;

    try {
      message = JSON.parse(rawData);
    } catch {
      this.send(ws, { type: 'error', data: { message: 'Invalid JSON' } });
      return;
    }

    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        await this.handleSubscribe(ws, client, message);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(ws, client);
        break;

      case 'ping':
        client.lastPing = Date.now();
        this.send(ws, { type: 'pong' });
        break;

      default:
        this.send(ws, { type: 'error', data: { message: 'Unknown message type' } });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SUBSCRIBE
  // ─────────────────────────────────────────────────────────────

  private async handleSubscribe(
    ws: WebSocket,
    client: WSClient,
    message: WSMessage
  ): Promise<void> {
    const { scopeId, token } = message;

    if (!token) {
      this.send(ws, { type: 'error', data: { message: 'Token required' } });
      return;
    }

    if (!scopeId) {
      this.send(ws, { type: 'error', data: { message: 'Scope ID required' } });
      return;
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      this.send(ws, { type: 'error', data: { message: 'Invalid token' } });
      return;
    }

    // Verify scope ownership
    const { data: scope, error } = await supabaseAdmin
      .from('scopes')
      .select('id')
      .eq('id', scopeId)
      .eq('user_id', payload.sub)
      .single();

    if (error || !scope) {
      this.send(ws, { type: 'error', data: { message: 'Scope not found or unauthorized' } });
      return;
    }

    // Update client
    client.user = {
      id: payload.sub,
      email: payload.email,
      plan: payload.plan as any,
    };
    client.scopeId = scopeId;
    client.isAuthenticated = true;

    // Add to scope subscribers
    if (!this.scopeSubscribers.has(scopeId)) {
      this.scopeSubscribers.set(scopeId, new Set());
    }
    this.scopeSubscribers.get(scopeId)!.add(ws);

    // Send confirmation
    this.send(ws, {
      type: 'subscribed',
      data: { scopeId },
    });

    // Send initial stats
    await this.sendStats(ws, scopeId);
  }

  // ─────────────────────────────────────────────────────────────
  // UNSUBSCRIBE
  // ─────────────────────────────────────────────────────────────

  private handleUnsubscribe(ws: WebSocket, client: WSClient): void {
    if (client.scopeId) {
      const subscribers = this.scopeSubscribers.get(client.scopeId);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.scopeSubscribers.delete(client.scopeId);
        }
      }
    }

    client.scopeId = null;
    this.send(ws, { type: 'unsubscribed' });
  }

  // ─────────────────────────────────────────────────────────────
  // DISCONNECT
  // ─────────────────────────────────────────────────────────────

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);

    if (client?.scopeId) {
      const subscribers = this.scopeSubscribers.get(client.scopeId);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.scopeSubscribers.delete(client.scopeId);
        }
      }
    }

    this.clients.delete(ws);
    console.log('[WS] Client disconnected');
  }

  // ─────────────────────────────────────────────────────────────
  // BROADCAST METHODS
  // ─────────────────────────────────────────────────────────────

  broadcastAccess(scopeId: string, event: AccessEventData): void {
    const subscribers = this.scopeSubscribers.get(scopeId);
    if (!subscribers) return;

    const message = {
      type: 'access',
      data: event,
    };

    for (const ws of subscribers) {
      this.send(ws, message);
    }
  }

  broadcastViolation(scopeId: string, violation: ViolationEventData): void {
    const subscribers = this.scopeSubscribers.get(scopeId);
    if (!subscribers) return;

    const message = {
      type: 'violation',
      data: violation,
    };

    for (const ws of subscribers) {
      this.send(ws, message);
    }
  }

  broadcastStats(scopeId: string, stats: StatsData): void {
    const subscribers = this.scopeSubscribers.get(scopeId);
    if (!subscribers) return;

    const message = {
      type: 'stats',
      data: stats,
    };

    for (const ws of subscribers) {
      this.send(ws, message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SEND STATS
  // ─────────────────────────────────────────────────────────────

  private async sendStats(ws: WebSocket, scopeId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logs } = await supabaseAdmin
      .from('access_logs')
      .select('result')
      .eq('scope_id', scopeId)
      .gte('created_at', today.toISOString());

    const stats: StatsData = {
      activeOperations: 0, // Would need real-time tracking
      blockedToday: logs?.filter((l) => l.result === 'blocked').length || 0,
      totalToday: logs?.length || 0,
    };

    this.send(ws, { type: 'stats', data: stats });
  }

  // ─────────────────────────────────────────────────────────────
  // HEARTBEAT
  // ─────────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
    const TIMEOUT = 60000; // 60 seconds

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [ws, client] of this.clients) {
        if (now - client.lastPing > TIMEOUT) {
          // Client hasn't responded in a while, disconnect
          ws.terminate();
          this.handleDisconnect(ws);
        } else {
          // Send ping
          this.send(ws, { type: 'ping' });
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private send(ws: WebSocket, message: object): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getSubscriberCount(scopeId: string): number {
    return this.scopeSubscribers.get(scopeId)?.size || 0;
  }

  getTotalClients(): number {
    return this.clients.size;
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const ws of this.clients.keys()) {
      ws.close();
    }

    this.clients.clear();
    this.scopeSubscribers.clear();
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default WSHandler;
