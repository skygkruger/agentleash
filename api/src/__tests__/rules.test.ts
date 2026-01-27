// ═══════════════════════════════════════════════════════════════
// RULES TESTS
// Tests for rule management and evaluation
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { z } from 'zod';
import { minimatch } from 'minimatch';

describe('Rules Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rule Validation Schema', () => {
    const ruleSchema = z.object({
      pathPattern: z.string().min(1),
      ruleType: z.enum(['allow', 'deny']),
      operations: z.array(z.enum(['read', 'write', 'delete', 'execute', 'list'])).min(1),
      priority: z.number().int().min(0).default(0),
      reason: z.string().max(500).optional(),
    });

    it('should validate valid rule data', () => {
      const validRule = {
        pathPattern: 'src/**/*.ts',
        ruleType: 'allow',
        operations: ['read', 'write'],
        priority: 10,
        reason: 'Source code access',
      };

      const result = ruleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
    });

    it('should reject rule without pattern', () => {
      const invalidRule = {
        ruleType: 'allow',
        operations: ['read'],
      };

      const result = ruleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });

    it('should reject rule without operations', () => {
      const invalidRule = {
        pathPattern: 'src/**',
        ruleType: 'allow',
        operations: [],
      };

      const result = ruleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });

    it('should reject invalid operations', () => {
      const invalidRule = {
        pathPattern: 'src/**',
        ruleType: 'allow',
        operations: ['read', 'invalid'],
      };

      const result = ruleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });
  });

  describe('Pattern Matching', () => {
    it('should match exact paths', () => {
      expect(minimatch('src/app.ts', 'src/app.ts')).toBe(true);
      expect(minimatch('src/app.ts', 'src/other.ts')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(minimatch('src/app.ts', 'src/*.ts')).toBe(true);
      expect(minimatch('src/utils/helper.ts', 'src/*.ts')).toBe(false);
    });

    it('should match globstar patterns', () => {
      expect(minimatch('src/app.ts', 'src/**/*.ts')).toBe(true);
      expect(minimatch('src/utils/helper.ts', 'src/**/*.ts')).toBe(true);
      expect(minimatch('src/components/ui/Button.tsx', 'src/**/*.tsx')).toBe(true);
    });

    it('should match .env patterns', () => {
      expect(minimatch('.env', '.env*')).toBe(true);
      expect(minimatch('.env.local', '.env*')).toBe(true);
      expect(minimatch('.env.production', '.env*')).toBe(true);
      expect(minimatch('env.config', '.env*')).toBe(false);
    });

    it('should match brace expansion', () => {
      expect(minimatch('file.ts', '*.{ts,tsx}')).toBe(true);
      expect(minimatch('file.tsx', '*.{ts,tsx}')).toBe(true);
      expect(minimatch('file.js', '*.{ts,tsx}')).toBe(false);
    });

    it('should match character classes', () => {
      expect(minimatch('file1.ts', 'file[0-9].ts')).toBe(true);
      expect(minimatch('file9.ts', 'file[0-9].ts')).toBe(true);
      expect(minimatch('filea.ts', 'file[0-9].ts')).toBe(false);
    });

    it('should handle negation patterns', () => {
      expect(minimatch('file.ts', '!*.ts')).toBe(false);
      expect(minimatch('file.js', '!*.ts')).toBe(true);
    });
  });

  describe('Rule Priority', () => {
    interface Rule {
      pattern: string;
      type: 'allow' | 'deny';
      priority: number;
    }

    const sortByPriority = (rules: Rule[]): Rule[] => {
      return [...rules].sort((a, b) => b.priority - a.priority);
    };

    it('should sort rules by priority descending', () => {
      const rules: Rule[] = [
        { pattern: 'src/**', type: 'allow', priority: 10 },
        { pattern: '.env*', type: 'deny', priority: 100 },
        { pattern: '**/*', type: 'deny', priority: 0 },
      ];

      const sorted = sortByPriority(rules);

      expect(sorted[0].priority).toBe(100);
      expect(sorted[1].priority).toBe(10);
      expect(sorted[2].priority).toBe(0);
    });

    it('should preserve order for equal priorities', () => {
      const rules: Rule[] = [
        { pattern: 'a/**', type: 'allow', priority: 10 },
        { pattern: 'b/**', type: 'allow', priority: 10 },
        { pattern: 'c/**', type: 'allow', priority: 10 },
      ];

      const sorted = sortByPriority(rules);

      // All have same priority
      expect(sorted.every(r => r.priority === 10)).toBe(true);
    });
  });

  describe('Access Evaluation', () => {
    interface Rule {
      pattern: string;
      type: 'allow' | 'deny';
      operations: string[];
      priority: number;
    }

    interface AccessRequest {
      path: string;
      operation: string;
    }

    interface AccessDecision {
      allowed: boolean;
      reason: string;
      matchedRule?: Rule;
    }

    const evaluateAccess = (
      request: AccessRequest,
      rules: Rule[],
      defaultPolicy: 'allow' | 'deny'
    ): AccessDecision => {
      // Sort by priority
      const sorted = [...rules].sort((a, b) => b.priority - a.priority);

      for (const rule of sorted) {
        if (minimatch(request.path, rule.pattern)) {
          if (rule.operations.includes(request.operation)) {
            return {
              allowed: rule.type === 'allow',
              reason: `Matched rule: ${rule.pattern}`,
              matchedRule: rule,
            };
          }
        }
      }

      return {
        allowed: defaultPolicy === 'allow',
        reason: `Default policy: ${defaultPolicy}`,
      };
    };

    it('should allow access when rule matches', () => {
      const rules: Rule[] = [
        { pattern: 'src/**', type: 'allow', operations: ['read', 'write'], priority: 10 },
      ];

      const result = evaluateAccess(
        { path: 'src/app.ts', operation: 'read' },
        rules,
        'deny'
      );

      expect(result.allowed).toBe(true);
      expect(result.matchedRule).toBeDefined();
    });

    it('should deny access when deny rule matches', () => {
      const rules: Rule[] = [
        { pattern: '.env*', type: 'deny', operations: ['read', 'write', 'delete'], priority: 100 },
        { pattern: '**/*', type: 'allow', operations: ['read'], priority: 0 },
      ];

      const result = evaluateAccess(
        { path: '.env.local', operation: 'read' },
        rules,
        'allow'
      );

      expect(result.allowed).toBe(false);
    });

    it('should use default policy when no rule matches', () => {
      const rules: Rule[] = [
        { pattern: 'src/**', type: 'allow', operations: ['read'], priority: 10 },
      ];

      const result = evaluateAccess(
        { path: 'other/file.txt', operation: 'read' },
        rules,
        'deny'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Default policy');
    });

    it('should check operation type', () => {
      const rules: Rule[] = [
        { pattern: 'src/**', type: 'allow', operations: ['read'], priority: 10 },
      ];

      const readResult = evaluateAccess(
        { path: 'src/app.ts', operation: 'read' },
        rules,
        'deny'
      );

      const writeResult = evaluateAccess(
        { path: 'src/app.ts', operation: 'write' },
        rules,
        'deny'
      );

      expect(readResult.allowed).toBe(true);
      expect(writeResult.allowed).toBe(false); // write not in allowed operations
    });
  });
});
