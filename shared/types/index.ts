// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SHARED TYPES
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// CONFIGURATION TYPES
// ───────────────────────────────────────────────────────────────

export type Operation = 'read' | 'write' | 'delete' | 'execute' | 'list';
export type RuleType = 'allow' | 'deny' | 'warn';
export type DefaultPolicy = 'allow' | 'deny';
export type MonitorMode = 'passive' | 'active' | 'interactive';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AccessResult = 'allowed' | 'blocked' | 'warning';

export interface Rule {
  id?: string;
  path: string;
  type?: RuleType;
  allow?: Operation[];
  deny?: Operation[];
  operations?: Operation[];
  priority?: number;
  reason?: string;
  except?: string[];
}

export interface AgentConfig {
  rules: Rule[];
}

export interface AlertConfig {
  notify_on: string[];
  webhook_url?: string | null;
  slack_webhook?: string | null;
  mass_operation_threshold?: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string | null;
  include_process_info?: boolean;
  include_timestamps?: boolean;
}

export interface ScopeConfig {
  version: number;
  name: string;
  base_path: string;
  default_policy: DefaultPolicy;
  rules: Rule[];
  agents?: Record<string, AgentConfig>;
  alerts?: AlertConfig;
  logging?: LoggingConfig;
}

// ───────────────────────────────────────────────────────────────
// ACCESS TYPES
// ───────────────────────────────────────────────────────────────

export interface AccessRequest {
  filePath: string;
  operation: Operation;
  agentIdentifier?: string;
  processName?: string;
  processPid?: number;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedRule?: Rule;
  severity?: 'info' | 'warning' | 'violation';
}

export interface AccessLog {
  id?: string;
  scopeId: string;
  sessionId?: string;
  filePath: string;
  operation: Operation;
  result: AccessResult;
  matchedRuleId?: string;
  agentIdentifier?: string;
  processName?: string;
  processPid?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AccessEvent {
  id: string;
  filePath: string;
  operation: Operation;
  result: AccessResult;
  timestamp: Date;
  agentIdentifier?: string;
}

// ───────────────────────────────────────────────────────────────
// VIOLATION TYPES
// ───────────────────────────────────────────────────────────────

export type ViolationType =
  | 'path_breach'
  | 'mass_delete'
  | 'config_access'
  | 'env_access'
  | 'key_access'
  | 'path_escape'
  | 'unauthorized_write'
  | 'unauthorized_execute';

export interface Violation {
  id?: string;
  scopeId: string;
  sessionId?: string;
  severity: Severity;
  type: ViolationType;
  description: string;
  affectedPaths?: string[];
  recommendedAction?: string;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  createdAt: Date;
}

// ───────────────────────────────────────────────────────────────
// SESSION TYPES
// ───────────────────────────────────────────────────────────────

export interface AgentSession {
  id: string;
  scopeId: string;
  sessionToken: string;
  agentName?: string;
  startedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  totalOperations: number;
  blockedOperations: number;
  lastActivityAt: Date;
}

// ───────────────────────────────────────────────────────────────
// SCOPE TYPES
// ───────────────────────────────────────────────────────────────

export interface Scope {
  id: string;
  userId: string;
  name: string;
  description?: string;
  basePath: string;
  isActive: boolean;
  configHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScopeRule {
  id: string;
  scopeId: string;
  ruleType: RuleType;
  pathPattern: string;
  operations: Operation[];
  priority: number;
  reason?: string;
  createdAt: Date;
}

// ───────────────────────────────────────────────────────────────
// USER TYPES
// ───────────────────────────────────────────────────────────────

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise';

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  plan: PlanType;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────────────────────────
// TEAM TYPES
// ───────────────────────────────────────────────────────────────

export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
}

// ───────────────────────────────────────────────────────────────
// WATCHER TYPES
// ───────────────────────────────────────────────────────────────

export interface WatcherConfig {
  basePath: string;
  rules: Rule[];
  onAccess: (event: AccessEvent) => void;
  onViolation: (violation: Violation) => void;
}

export interface WatcherStats {
  isWatching: boolean;
  basePath: string;
  ruleCount: number;
  totalOperations: number;
  allowedOperations: number;
  blockedOperations: number;
  warnings: number;
  startedAt?: Date;
}

// ───────────────────────────────────────────────────────────────
// WEBSOCKET TYPES
// ───────────────────────────────────────────────────────────────

export type WSMessageType = 'subscribe' | 'unsubscribe' | 'access' | 'violation' | 'stats' | 'error';

export interface WSMessage {
  type: WSMessageType;
  data?: unknown;
  scopeId?: string;
  token?: string;
}

export interface WSAccessMessage {
  type: 'access';
  data: {
    id: string;
    filePath: string;
    operation: Operation;
    result: AccessResult;
    timestamp: string;
    agentIdentifier?: string;
  };
}

export interface WSViolationMessage {
  type: 'violation';
  data: {
    id: string;
    severity: Severity;
    type: ViolationType;
    description: string;
    timestamp: string;
  };
}

export interface WSStatsMessage {
  type: 'stats';
  data: {
    activeOperations: number;
    blockedToday: number;
    totalToday: number;
  };
}

// ───────────────────────────────────────────────────────────────
// API TYPES
// ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ───────────────────────────────────────────────────────────────
// PLAN LIMITS
// ───────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxScopes: number;
  maxLogsPerDay: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxScopes: 1,
    maxLogsPerDay: 1000,
    features: ['basic_monitoring'],
  },
  pro: {
    maxScopes: 5,
    maxLogsPerDay: 10000,
    features: ['basic_monitoring', 'custom_rules', 'export'],
  },
  team: {
    maxScopes: 20,
    maxLogsPerDay: 100000,
    features: ['basic_monitoring', 'custom_rules', 'export', 'team_sharing', 'webhooks'],
  },
  enterprise: {
    maxScopes: Infinity,
    maxLogsPerDay: Infinity,
    features: ['basic_monitoring', 'custom_rules', 'export', 'team_sharing', 'webhooks', 'sso', 'compliance'],
  },
};
