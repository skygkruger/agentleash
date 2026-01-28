// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT API CLIENT
// HTTP client for cloud API communication
// ═══════════════════════════════════════════════════════════════

import {
  getAuthHeader,
  saveTokens,
  getRefreshToken,
  saveUser,
  UserInfo,
} from './auth';

// ───────────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.SCOPEAGENT_API_URL || 'http://localhost:3001';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: UserInfo;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface ScopeData {
  id: string;
  name: string;
  description?: string;
  basePath: string;
  defaultPolicy: 'allow' | 'deny';
  isActive: boolean;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface RuleData {
  id: string;
  pathPattern: string;
  ruleType: 'allow' | 'deny';
  operations: string[];
  priority: number;
  reason?: string;
}

export interface LogData {
  id: string;
  filePath: string;
  operation: string;
  result: 'allowed' | 'blocked' | 'warning';
  agentIdentifier?: string;
  processName?: string;
  createdAt: string;
}

export interface StatsData {
  period: string;
  total: number;
  allowed: number;
  blocked: number;
  warnings: number;
  operations: Record<string, number>;
}

// ───────────────────────────────────────────────────────────────
// HTTP CLIENT
// ───────────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth header if available
  const authHeader = getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle token refresh if needed
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        // Retry the request with new token
        return request<T>(endpoint, options);
      }
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json() as { success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number } };
    if (data.success && data.data) {
      saveTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresAt: Date.now() + data.data.expiresIn * 1000,
      });
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// AUTH ENDPOINTS
// ───────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const response = await request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.success && response.data) {
    saveTokens({
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
      expiresAt: Date.now() + response.data.tokens.expiresIn * 1000,
    });
    saveUser(response.data.user);
  }

  return response;
}

export async function register(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const response = await request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.success && response.data) {
    saveTokens({
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
      expiresAt: Date.now() + response.data.tokens.expiresIn * 1000,
    });
    saveUser(response.data.user);
  }

  return response;
}

export async function getMe(): Promise<ApiResponse<UserInfo>> {
  return request<UserInfo>('/api/auth/me');
}

export async function createApiKey(
  name: string
): Promise<ApiResponse<{ key: string; id: string }>> {
  return request('/api/auth/api-key', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ───────────────────────────────────────────────────────────────
// SCOPES ENDPOINTS
// ───────────────────────────────────────────────────────────────

export async function listScopes(): Promise<ApiResponse<ScopeData[]>> {
  return request<ScopeData[]>('/api/scopes');
}

export async function getScope(scopeId: string): Promise<ApiResponse<ScopeData>> {
  return request<ScopeData>(`/api/scopes/${scopeId}`);
}

export async function createScope(data: {
  name: string;
  description?: string;
  basePath: string;
  defaultPolicy?: 'allow' | 'deny';
}): Promise<ApiResponse<ScopeData>> {
  return request<ScopeData>('/api/scopes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScope(
  scopeId: string,
  data: Partial<ScopeData>
): Promise<ApiResponse<ScopeData>> {
  return request<ScopeData>(`/api/scopes/${scopeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScope(scopeId: string): Promise<ApiResponse<void>> {
  return request<void>(`/api/scopes/${scopeId}`, {
    method: 'DELETE',
  });
}

export async function syncScope(
  scopeId: string,
  rules: RuleData[]
): Promise<ApiResponse<{ synced: number }>> {
  return request(`/api/scopes/${scopeId}/sync`, {
    method: 'POST',
    body: JSON.stringify({ rules }),
  });
}

export async function exportScope(
  scopeId: string
): Promise<ApiResponse<{ config: unknown }>> {
  return request(`/api/scopes/${scopeId}/export`);
}

// ───────────────────────────────────────────────────────────────
// RULES ENDPOINTS
// ───────────────────────────────────────────────────────────────

export async function listRules(scopeId: string): Promise<ApiResponse<RuleData[]>> {
  return request<RuleData[]>(`/api/scopes/${scopeId}/rules`);
}

export async function createRule(
  scopeId: string,
  data: {
    pathPattern: string;
    ruleType: 'allow' | 'deny';
    operations: string[];
    priority?: number;
    reason?: string;
  }
): Promise<ApiResponse<RuleData>> {
  return request<RuleData>(`/api/scopes/${scopeId}/rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRule(
  scopeId: string,
  ruleId: string,
  data: Partial<RuleData>
): Promise<ApiResponse<RuleData>> {
  return request<RuleData>(`/api/scopes/${scopeId}/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRule(
  scopeId: string,
  ruleId: string
): Promise<ApiResponse<void>> {
  return request<void>(`/api/scopes/${scopeId}/rules/${ruleId}`, {
    method: 'DELETE',
  });
}

export async function testRule(
  scopeId: string,
  filePath: string,
  operation: string
): Promise<
  ApiResponse<{
    path: string;
    operation: string;
    allowed: boolean;
    reason: string;
    matchedRule?: RuleData;
  }>
> {
  return request(`/api/scopes/${scopeId}/rules/test`, {
    method: 'POST',
    body: JSON.stringify({ filePath, operation }),
  });
}

// ───────────────────────────────────────────────────────────────
// LOGS ENDPOINTS
// ───────────────────────────────────────────────────────────────

export async function listLogs(
  scopeId: string,
  options: {
    limit?: number;
    offset?: number;
    operation?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<
  ApiResponse<{
    logs: LogData[];
    total: number;
    hasMore: boolean;
  }>
> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());
  if (options.operation) params.set('operation', options.operation);
  if (options.result) params.set('result', options.result);
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);

  const query = params.toString();
  return request(`/api/scopes/${scopeId}/logs${query ? `?${query}` : ''}`);
}

export async function getLogStats(
  scopeId: string,
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<ApiResponse<StatsData>> {
  return request<StatsData>(`/api/scopes/${scopeId}/logs/stats?period=${period}`);
}

export async function sendLogs(
  scopeId: string,
  logs: Array<{
    filePath: string;
    operation: string;
    result: 'allowed' | 'blocked' | 'warning';
    matchedRuleId?: string;
    agentIdentifier?: string;
    processName?: string;
  }>
): Promise<ApiResponse<{ saved: number }>> {
  return request(`/api/scopes/${scopeId}/logs`, {
    method: 'POST',
    body: JSON.stringify({ logs }),
  });
}

// ───────────────────────────────────────────────────────────────
// VIOLATIONS ENDPOINTS
// ───────────────────────────────────────────────────────────────

export async function listViolations(
  scopeId: string,
  options: {
    limit?: number;
    offset?: number;
    severity?: string;
    acknowledged?: boolean;
  } = {}
): Promise<ApiResponse<{ violations: unknown[]; total: number }>> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());
  if (options.severity) params.set('severity', options.severity);
  if (options.acknowledged !== undefined)
    params.set('acknowledged', options.acknowledged.toString());

  const query = params.toString();
  return request(`/api/scopes/${scopeId}/violations${query ? `?${query}` : ''}`);
}

export async function getViolationSummary(
  scopeId: string
): Promise<
  ApiResponse<{
    total: number;
    unacknowledged: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }>
> {
  return request(`/api/scopes/${scopeId}/violations/summary`);
}

// ───────────────────────────────────────────────────────────────
// HEALTH CHECK
// ───────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<
  ApiResponse<{
    status: string;
    service: string;
    version: string;
    database: string;
  }>
> {
  return request('/health');
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  login,
  register,
  getMe,
  createApiKey,
  listScopes,
  getScope,
  createScope,
  updateScope,
  deleteScope,
  syncScope,
  exportScope,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  testRule,
  listLogs,
  getLogStats,
  sendLogs,
  listViolations,
  getViolationSummary,
  healthCheck,
};
