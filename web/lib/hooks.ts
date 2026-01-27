// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { api } from './api';

// ───────────────────────────────────────────────────────────────
// BLINKING CURSOR HOOK
// ───────────────────────────────────────────────────────────────

export function useBlinkingCursor(interval = 530) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setVisible((v) => !v), interval);
    return () => clearInterval(timer);
  }, [interval]);

  return visible;
}

// ───────────────────────────────────────────────────────────────
// WEBSOCKET HOOK
// ───────────────────────────────────────────────────────────────

interface WSMessage {
  type: string;
  data?: unknown;
}

export function useWebSocket(url: string, scopeId?: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
      if (scopeId) {
        socket.send(JSON.stringify({ type: 'subscribe', scopeId }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [message, ...prev.slice(0, 99)]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url, scopeId]);

  const send = useCallback(
    (message: WSMessage) => {
      if (ws && connected) {
        ws.send(JSON.stringify(message));
      }
    },
    [ws, connected]
  );

  return { connected, messages, send };
}

// ───────────────────────────────────────────────────────────────
// SCOPES HOOK
// ───────────────────────────────────────────────────────────────

export function useScopes() {
  const { data, error, isLoading, mutate } = useSWR('scopes', () =>
    api.getScopes()
  );

  return {
    scopes: data?.data || [],
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  };
}

// ───────────────────────────────────────────────────────────────
// SCOPE HOOK
// ───────────────────────────────────────────────────────────────

export function useScope(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `scope-${id}` : null,
    () => api.getScope(id)
  );

  return {
    scope: data?.data,
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  };
}

// ───────────────────────────────────────────────────────────────
// RULES HOOK
// ───────────────────────────────────────────────────────────────

export function useRules(scopeId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    scopeId ? `rules-${scopeId}` : null,
    () => api.getRules(scopeId)
  );

  return {
    rules: data?.data || [],
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  };
}

// ───────────────────────────────────────────────────────────────
// LOGS HOOK
// ───────────────────────────────────────────────────────────────

export function useLogs(scopeId: string, limit = 50) {
  const { data, error, isLoading, mutate } = useSWR(
    scopeId ? `logs-${scopeId}` : null,
    () => api.getLogs(scopeId, { limit }),
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );

  return {
    logs: data?.data || [],
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  };
}

// ───────────────────────────────────────────────────────────────
// VIOLATIONS HOOK
// ───────────────────────────────────────────────────────────────

export function useViolations(scopeId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    scopeId ? `violations-${scopeId}` : null,
    () => api.getViolations(scopeId)
  );

  return {
    violations: data?.data || [],
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  };
}
