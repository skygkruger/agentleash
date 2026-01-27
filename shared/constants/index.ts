// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// PRODUCT INFO
// ───────────────────────────────────────────────────────────────

export const PRODUCT_NAME = 'ScopeAgent';
export const PRODUCT_VERSION = '1.0.0';
export const PRODUCT_TAGLINE = 'AI agents are powerful. ScopeAgent keeps them in line.';

// ───────────────────────────────────────────────────────────────
// DESIGN SYSTEM COLORS
// ───────────────────────────────────────────────────────────────

export const COLORS = {
  // Base
  bg: '#1a1a2e',
  bgLight: '#252542',
  bgCard: '#1f1f35',

  // Text
  text: '#e8e3e3',
  textMuted: '#6e6a86',

  // Accents
  amber: '#d4a76a',      // ScopeAgent primary
  mint: '#a8d8b9',       // Success/allowed
  coral: '#eb6f92',      // Error/blocked
  lavender: '#c4a7e7',   // Info/highlight
  cyan: '#7eb8da',       // Links/interactive
  cream: '#ffe9b0',      // Warnings

  // Borders
  border: '#6e6a86',
  borderLight: '#4a4a6a',
} as const;

// ───────────────────────────────────────────────────────────────
// STATUS ICONS
// ───────────────────────────────────────────────────────────────

export const STATUS_ICONS = {
  allowed: '[/]',
  blocked: '[X]',
  warning: '[!]',
  watching: '[*]',
  pending: '[~]',
  help: '[?]',
  add: '[+]',
  config: '[#]',
  action: '[>]',
} as const;

// ───────────────────────────────────────────────────────────────
// OPERATIONS
// ───────────────────────────────────────────────────────────────

export const OPERATIONS = ['read', 'write', 'delete', 'execute', 'list'] as const;

export const OPERATION_LABELS: Record<string, string> = {
  read: 'READ',
  write: 'WRITE',
  delete: 'DELETE',
  execute: 'EXECUTE',
  list: 'LIST',
};

// ───────────────────────────────────────────────────────────────
// SUPPORTED AGENTS
// ───────────────────────────────────────────────────────────────

export const SUPPORTED_AGENTS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    status: 'supported',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    status: 'supported',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    status: 'coming_soon',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    status: 'coming_soon',
  },
] as const;

// ───────────────────────────────────────────────────────────────
// DEFAULT SENSITIVE PATTERNS
// ───────────────────────────────────────────────────────────────

export const DEFAULT_SENSITIVE_PATTERNS = [
  '.env',
  '.env.*',
  '**/*.key',
  '**/*.pem',
  '**/*.p12',
  '**/id_rsa*',
  '**/.ssh/**',
  '**/secrets/**',
  '**/credentials/**',
  '**/.aws/**',
  '**/.gcloud/**',
  '**/private/**',
] as const;

// ───────────────────────────────────────────────────────────────
// CONFIG FILE
// ───────────────────────────────────────────────────────────────

export const CONFIG_FILE_NAME = '.scopeagent.yml';
export const CONFIG_VERSION = 1;

// ───────────────────────────────────────────────────────────────
// API ENDPOINTS
// ───────────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    apiKey: '/api/auth/api-key',
  },
  scopes: {
    list: '/api/scopes',
    create: '/api/scopes',
    get: '/api/scopes/:id',
    update: '/api/scopes/:id',
    delete: '/api/scopes/:id',
    sync: '/api/scopes/:id/sync',
    export: '/api/scopes/:id/export',
  },
  rules: {
    list: '/api/scopes/:scopeId/rules',
    create: '/api/scopes/:scopeId/rules',
    update: '/api/scopes/:scopeId/rules/:ruleId',
    delete: '/api/scopes/:scopeId/rules/:ruleId',
    test: '/api/scopes/:scopeId/rules/test',
    bulk: '/api/scopes/:scopeId/rules/bulk',
  },
  logs: {
    list: '/api/scopes/:scopeId/logs',
    stats: '/api/scopes/:scopeId/logs/stats',
    export: '/api/scopes/:scopeId/logs/export',
  },
  violations: {
    list: '/api/scopes/:scopeId/violations',
    acknowledge: '/api/scopes/:scopeId/violations/:id/acknowledge',
    summary: '/api/scopes/:scopeId/violations/summary',
  },
} as const;

// ───────────────────────────────────────────────────────────────
// RATE LIMITS
// ───────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10,
  },
  logs: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // logs per minute
  },
} as const;

// ───────────────────────────────────────────────────────────────
// WEBSOCKET
// ───────────────────────────────────────────────────────────────

export const WS_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  reconnectInterval: 5000, // 5 seconds
  maxReconnectAttempts: 5,
} as const;

// ───────────────────────────────────────────────────────────────
// ASCII LOGO
// ───────────────────────────────────────────────────────────────

export const ASCII_LOGO = `
███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘`;

export const ASCII_LOGO_COMPACT = `╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝`;
