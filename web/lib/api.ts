// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT WEB API CLIENT
// HTTP client for API communication
// ═══════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Scope {
  id: string;
  name: string;
  description?: string;
  basePath: string;
  defaultPolicy: 'allow' | 'deny';
  isActive: boolean;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface Rule {
  id: string;
  pathPattern: string;
  ruleType: 'allow' | 'deny';
  operations: string[];
  priority: number;
  reason?: string;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  filePath: string;
  operation: string;
  result: 'allowed' | 'blocked' | 'warning';
  agentIdentifier?: string;
  processName?: string;
  matchedRuleId?: string;
  createdAt: string;
}

export interface Violation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  affectedPaths?: string[];
  recommendedAction?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface Stats {
  period: string;
  total: number;
  allowed: number;
  blocked: number;
  warnings: number;
  operations: Record<string, number>;
  hourly: Array<{
    hour: string;
    allowed: number;
    blocked: number;
    warnings: number;
  }>;
}

export interface ViolationSummary {
  total: number;
  unacknowledged: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

// ───────────────────────────────────────────────────────────────
// API CLIENT CLASS
// ───────────────────────────────────────────────────────────────

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Handle token refresh
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, options);
        }
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
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

  // ─────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }

    return response;
  }

  async register(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearTokens();
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me');
  }

  async getApiKeys(): Promise<ApiResponse<Array<{ id: string; name: string; createdAt: string }>>> {
    return this.request('/api/auth/api-keys');
  }

  async createApiKey(name: string): Promise<ApiResponse<{ key: string; id: string }>> {
    return this.request('/api/auth/api-key', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteApiKey(keyId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/auth/api-key/${keyId}`, { method: 'DELETE' });
  }

  // ─────────────────────────────────────────────────────────────
  // SCOPES
  // ─────────────────────────────────────────────────────────────

  async getScopes(): Promise<ApiResponse<Scope[]>> {
    return this.request<Scope[]>('/api/scopes');
  }

  async getScope(id: string): Promise<ApiResponse<Scope>> {
    return this.request<Scope>(`/api/scopes/${id}`);
  }

  async createScope(data: {
    name: string;
    description?: string;
    basePath: string;
    defaultPolicy?: 'allow' | 'deny';
  }): Promise<ApiResponse<Scope>> {
    return this.request<Scope>('/api/scopes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScope(id: string, data: Partial<Scope>): Promise<ApiResponse<Scope>> {
    return this.request<Scope>(`/api/scopes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScope(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/scopes/${id}`, { method: 'DELETE' });
  }

  // ─────────────────────────────────────────────────────────────
  // RULES
  // ─────────────────────────────────────────────────────────────

  async getRules(scopeId: string): Promise<ApiResponse<Rule[]>> {
    return this.request<Rule[]>(`/api/scopes/${scopeId}/rules`);
  }

  async createRule(
    scopeId: string,
    data: {
      pathPattern: string;
      ruleType: 'allow' | 'deny';
      operations: string[];
      priority?: number;
      reason?: string;
    }
  ): Promise<ApiResponse<Rule>> {
    return this.request<Rule>(`/api/scopes/${scopeId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRule(scopeId: string, ruleId: string, data: Partial<Rule>): Promise<ApiResponse<Rule>> {
    return this.request<Rule>(`/api/scopes/${scopeId}/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRule(scopeId: string, ruleId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/scopes/${scopeId}/rules/${ruleId}`, { method: 'DELETE' });
  }

  async testRule(
    scopeId: string,
    filePath: string,
    operation: string
  ): Promise<ApiResponse<{ path: string; operation: string; allowed: boolean; reason: string; matchedRule?: Rule }>> {
    return this.request(`/api/scopes/${scopeId}/rules/test`, {
      method: 'POST',
      body: JSON.stringify({ filePath, operation }),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // LOGS
  // ─────────────────────────────────────────────────────────────

  async getLogs(
    scopeId: string,
    params?: {
      limit?: number;
      offset?: number;
      operation?: string;
      result?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<AccessLog[]> & { total?: number; hasMore?: boolean }> {
    const query = params
      ? `?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          ) as Record<string, string>
        ).toString()}`
      : '';
    return this.request(`/api/scopes/${scopeId}/logs${query}`);
  }

  async getStats(scopeId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<ApiResponse<Stats>> {
    return this.request<Stats>(`/api/scopes/${scopeId}/logs/stats?period=${period}`);
  }

  // ─────────────────────────────────────────────────────────────
  // VIOLATIONS
  // ─────────────────────────────────────────────────────────────

  async getViolations(
    scopeId: string,
    params?: {
      limit?: number;
      offset?: number;
      severity?: string;
      acknowledged?: boolean;
    }
  ): Promise<ApiResponse<Violation[]> & { total?: number; hasMore?: boolean }> {
    const query = params
      ? `?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          ) as Record<string, string>
        ).toString()}`
      : '';
    return this.request(`/api/scopes/${scopeId}/violations${query}`);
  }

  async getViolationSummary(scopeId: string): Promise<ApiResponse<ViolationSummary>> {
    return this.request<ViolationSummary>(`/api/scopes/${scopeId}/violations/summary`);
  }

  async acknowledgeViolation(scopeId: string, violationId: string, note?: string): Promise<ApiResponse<Violation>> {
    return this.request<Violation>(`/api/scopes/${scopeId}/violations/${violationId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HEALTH
  // ─────────────────────────────────────────────────────────────

  async healthCheck(): Promise<ApiResponse<{ status: string; database: string }>> {
    return this.request('/health');
  }

  // ─────────────────────────────────────────────────────────────
  // BUNDLES
  // ─────────────────────────────────────────────────────────────

  async getBundles(): Promise<ApiResponse<{
    bundles: Array<{
      id: string;
      name: string;
      description: string;
      products: { vaultAgent: string; scopeAgent: string };
      features: string[];
      pricing: {
        monthly: { amount: number; formatted: string; savings: number; savingsFormatted: string };
        yearly: { amount: number; formatted: string; monthlyEquivalent: string; savings: number; savingsFormatted: string };
      };
      comparison: { separateMonthly: number; separateYearly: number };
    }>;
    tagline: string;
    description: string;
  }>> {
    return this.request('/api/bundles');
  }

  async getBundle(bundleId: string): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    products: { vaultAgent: string; scopeAgent: string };
    features: string[];
    pricing: {
      monthly: { amount: number; formatted: string; savings: number };
      yearly: { amount: number; formatted: string; monthlyEquivalent: string; savings: number };
    };
  }>> {
    return this.request(`/api/bundles/${bundleId}`);
  }

  async subscribeToBundle(
    bundleId: string,
    interval: 'monthly' | 'yearly',
    successUrl?: string,
    cancelUrl?: string
  ): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return this.request('/api/bundles/subscribe', {
      method: 'POST',
      body: JSON.stringify({ bundleId, interval, successUrl, cancelUrl }),
    });
  }

  async getBundleUpgradeOptions(): Promise<ApiResponse<{
    currentPlan: string;
    availableUpgrades: Array<{
      id: string;
      name: string;
      description: string;
      currentPlan: string;
      newPlan: string;
      pricing: { monthly: number; yearly: number };
      features: string[];
    }>;
    recommendation: string | null;
  }>> {
    return this.request('/api/bundles/upgrade/options');
  }

  async upgradeToBundle(
    bundleId: string,
    interval?: 'monthly' | 'yearly'
  ): Promise<ApiResponse<{
    subscriptionId: string;
    newPlan: string;
    proratedAmount: number;
    effectiveDate: string;
  }>> {
    return this.request('/api/bundles/upgrade', {
      method: 'POST',
      body: JSON.stringify({ bundleId, interval }),
    });
  }

  async getBundleStatus(): Promise<ApiResponse<{
    currentPlan: string;
    hasBundle: boolean;
    bundle: {
      bundleId: string;
      bundleName: string;
      status: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      products: { vaultAgent: string; scopeAgent: string };
    } | null;
    availableBundles: Array<{ id: string; name: string; plan: string }>;
  }>> {
    return this.request('/api/bundles/status');
  }

  async cancelBundle(immediately?: boolean): Promise<ApiResponse<{
    message: string;
    effectiveDate: string;
    newPlan?: string;
    currentPlan?: string;
  }>> {
    return this.request('/api/bundles/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediately }),
    });
  }
}

export const api = new ApiClient(API_URL);
export default api;
