'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from './api';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ───────────────────────────────────────────────────────────────
// CONTEXT
// ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ───────────────────────────────────────────────────────────────
// PROVIDER
// ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const result = await api.getMe();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setUser(null);
        api.clearTokens();
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.login(email, password);
      if (result.success && result.data) {
        setUser(result.data.user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.register(email, password);
      if (result.success && result.data) {
        setUser(result.data.user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────
// HOOK
// ───────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
