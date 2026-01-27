// ═══════════════════════════════════════════════════════════════
// SCOPES TESTS
// Tests for scope CRUD operations
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { z } from 'zod';

describe('Scopes Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Scope Validation Schema', () => {
    const scopeSchema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      basePath: z.string().min(1),
      defaultPolicy: z.enum(['allow', 'deny']).default('deny'),
    });

    it('should validate valid scope data', () => {
      const validScope = {
        name: 'my-project',
        description: 'Test project scope',
        basePath: '/Users/dev/projects/myapp',
        defaultPolicy: 'deny',
      };

      const result = scopeSchema.safeParse(validScope);
      expect(result.success).toBe(true);
    });

    it('should reject scope without name', () => {
      const invalidScope = {
        basePath: '/test/path',
        defaultPolicy: 'deny',
      };

      const result = scopeSchema.safeParse(invalidScope);
      expect(result.success).toBe(false);
    });

    it('should reject scope without basePath', () => {
      const invalidScope = {
        name: 'test-scope',
        defaultPolicy: 'deny',
      };

      const result = scopeSchema.safeParse(invalidScope);
      expect(result.success).toBe(false);
    });

    it('should use default policy when not specified', () => {
      const scope = {
        name: 'test-scope',
        basePath: '/test/path',
      };

      const result = scopeSchema.safeParse(scope);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.defaultPolicy).toBe('deny');
      }
    });

    it('should reject invalid policy values', () => {
      const invalidScope = {
        name: 'test-scope',
        basePath: '/test/path',
        defaultPolicy: 'invalid',
      };

      const result = scopeSchema.safeParse(invalidScope);
      expect(result.success).toBe(false);
    });
  });

  describe('Scope Name Validation', () => {
    const validateScopeName = (name: string): boolean => {
      // Allow alphanumeric, hyphens, underscores
      const nameRegex = /^[a-zA-Z0-9_-]+$/;
      return nameRegex.test(name) && name.length >= 1 && name.length <= 255;
    };

    it('should accept valid scope names', () => {
      expect(validateScopeName('my-project')).toBe(true);
      expect(validateScopeName('project_v2')).toBe(true);
      expect(validateScopeName('TestScope123')).toBe(true);
    });

    it('should reject invalid scope names', () => {
      expect(validateScopeName('')).toBe(false);
      expect(validateScopeName('has spaces')).toBe(false);
      expect(validateScopeName('special@chars!')).toBe(false);
    });
  });

  describe('Base Path Normalization', () => {
    const normalizePath = (inputPath: string): string => {
      // Remove trailing slashes
      let normalized = inputPath.replace(/\/+$/, '');
      // Normalize multiple slashes
      normalized = normalized.replace(/\/+/g, '/');
      return normalized;
    };

    it('should remove trailing slashes', () => {
      expect(normalizePath('/test/path/')).toBe('/test/path');
      expect(normalizePath('/test/path///')).toBe('/test/path');
    });

    it('should normalize multiple slashes', () => {
      expect(normalizePath('/test//path///dir')).toBe('/test/path/dir');
    });

    it('should handle root path', () => {
      expect(normalizePath('/')).toBe('');
    });
  });

  describe('Scope Statistics', () => {
    interface ScopeStats {
      totalRules: number;
      allowRules: number;
      denyRules: number;
      recentAccessCount: number;
      blockedCount: number;
    }

    const calculateStats = (rules: Array<{ type: string }>, logs: Array<{ result: string }>): ScopeStats => {
      return {
        totalRules: rules.length,
        allowRules: rules.filter(r => r.type === 'allow').length,
        denyRules: rules.filter(r => r.type === 'deny').length,
        recentAccessCount: logs.length,
        blockedCount: logs.filter(l => l.result === 'blocked').length,
      };
    };

    it('should calculate correct rule counts', () => {
      const rules = [
        { type: 'allow' },
        { type: 'allow' },
        { type: 'deny' },
      ];
      const logs: Array<{ result: string }> = [];

      const stats = calculateStats(rules, logs);

      expect(stats.totalRules).toBe(3);
      expect(stats.allowRules).toBe(2);
      expect(stats.denyRules).toBe(1);
    });

    it('should calculate correct log counts', () => {
      const rules: Array<{ type: string }> = [];
      const logs = [
        { result: 'allowed' },
        { result: 'blocked' },
        { result: 'blocked' },
        { result: 'warning' },
      ];

      const stats = calculateStats(rules, logs);

      expect(stats.recentAccessCount).toBe(4);
      expect(stats.blockedCount).toBe(2);
    });
  });
});
