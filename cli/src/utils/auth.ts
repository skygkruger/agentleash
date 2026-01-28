// ═══════════════════════════════════════════════════════════════
// AGENTLEASH AUTH UTILITIES
// Token storage and authentication helpers
// ═══════════════════════════════════════════════════════════════

import Conf from 'conf';
import * as path from 'path';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserInfo {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface AuthState {
  tokens: AuthTokens | null;
  user: UserInfo | null;
  apiKey: string | null;
}

// ───────────────────────────────────────────────────────────────
// CONFIG STORE
// ───────────────────────────────────────────────────────────────

const config = new Conf<AuthState>({
  projectName: 'agentleash',
  projectVersion: '1.0.0',
  defaults: {
    tokens: null,
    user: null,
    apiKey: null,
  },
});

// ───────────────────────────────────────────────────────────────
// TOKEN MANAGEMENT
// ───────────────────────────────────────────────────────────────

export function saveTokens(tokens: AuthTokens): void {
  config.set('tokens', tokens);
}

export function getTokens(): AuthTokens | null {
  return config.get('tokens');
}

export function clearTokens(): void {
  config.set('tokens', null);
}

export function isTokenExpired(): boolean {
  const tokens = getTokens();
  if (!tokens) return true;

  // Add 60 second buffer
  return Date.now() >= tokens.expiresAt - 60000;
}

export function getAccessToken(): string | null {
  const tokens = getTokens();
  if (!tokens) return null;

  if (isTokenExpired()) {
    return null;
  }

  return tokens.accessToken;
}

export function getRefreshToken(): string | null {
  const tokens = getTokens();
  return tokens?.refreshToken || null;
}

// ───────────────────────────────────────────────────────────────
// API KEY MANAGEMENT
// ───────────────────────────────────────────────────────────────

export function saveApiKey(apiKey: string): void {
  config.set('apiKey', apiKey);
}

export function getApiKey(): string | null {
  return config.get('apiKey');
}

export function clearApiKey(): void {
  config.set('apiKey', null);
}

// ───────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ───────────────────────────────────────────────────────────────

export function saveUser(user: UserInfo): void {
  config.set('user', user);
}

export function getUser(): UserInfo | null {
  return config.get('user');
}

export function clearUser(): void {
  config.set('user', null);
}

// ───────────────────────────────────────────────────────────────
// AUTH STATUS
// ───────────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  // Check for API key first
  if (getApiKey()) return true;

  // Check for valid tokens
  const tokens = getTokens();
  if (!tokens) return false;

  // Token is valid if not expired
  return !isTokenExpired();
}

export function getAuthHeader(): string | null {
  // Prefer API key
  const apiKey = getApiKey();
  if (apiKey) {
    return `Bearer ${apiKey}`;
  }

  // Fall back to access token
  const accessToken = getAccessToken();
  if (accessToken) {
    return `Bearer ${accessToken}`;
  }

  return null;
}

// ───────────────────────────────────────────────────────────────
// LOGOUT
// ───────────────────────────────────────────────────────────────

export function logout(): void {
  clearTokens();
  clearUser();
  // Note: We keep API key unless explicitly cleared
}

export function logoutFull(): void {
  clearTokens();
  clearUser();
  clearApiKey();
}

// ───────────────────────────────────────────────────────────────
// CONFIG PATH
// ───────────────────────────────────────────────────────────────

export function getConfigPath(): string {
  return config.path;
}

export function getConfigDir(): string {
  return path.dirname(config.path);
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  saveTokens,
  getTokens,
  clearTokens,
  isTokenExpired,
  getAccessToken,
  getRefreshToken,
  saveApiKey,
  getApiKey,
  clearApiKey,
  saveUser,
  getUser,
  clearUser,
  isAuthenticated,
  getAuthHeader,
  logout,
  logoutFull,
  getConfigPath,
  getConfigDir,
};
