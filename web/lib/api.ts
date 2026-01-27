// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT API CLIENT
// ═══════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Scopes
  async getScopes() {
    return this.request('/api/scopes');
  }

  async getScope(id: string) {
    return this.request(`/api/scopes/${id}`);
  }

  async createScope(data: { name: string; basePath: string; description?: string }) {
    return this.request('/api/scopes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Rules
  async getRules(scopeId: string) {
    return this.request(`/api/scopes/${scopeId}/rules`);
  }

  async createRule(scopeId: string, data: { pathPattern: string; ruleType: string; operations: string[] }) {
    return this.request(`/api/scopes/${scopeId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Logs
  async getLogs(scopeId: string, params?: { limit?: number; offset?: number }) {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return this.request(`/api/scopes/${scopeId}/logs${query}`);
  }

  // Violations
  async getViolations(scopeId: string) {
    return this.request(`/api/scopes/${scopeId}/violations`);
  }
}

export const api = new ApiClient(API_URL);
export default api;
