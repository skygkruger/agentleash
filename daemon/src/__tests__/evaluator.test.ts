// ═══════════════════════════════════════════════════════════════
// EVALUATOR TESTS
// Tests for rule evaluation engine
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from '@jest/globals';
import { minimatch } from 'minimatch';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

interface Rule {
  path: string;
  type: 'allow' | 'deny' | 'mixed';
  operations: string[];
  priority: number;
  reason?: string;
}

interface AccessRequest {
  filePath: string;
  operation: 'read' | 'write' | 'delete' | 'execute' | 'list';
  agentIdentifier?: string;
}

interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedRule?: Rule;
  severity?: 'info' | 'warning' | 'violation';
}

// ───────────────────────────────────────────────────────────────
// EVALUATION FUNCTIONS
// ───────────────────────────────────────────────────────────────

const normalizePath = (inputPath: string): string => {
  return inputPath.replace(/\\/g, '/');
};

const matchPath = (filePath: string, pattern: string): boolean => {
  const normalizedPath = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern);
  return minimatch(normalizedPath, normalizedPattern, { dot: true });
};

const evaluateAccess = (
  request: AccessRequest,
  rules: Rule[],
  defaultPolicy: 'allow' | 'deny'
): AccessDecision => {
  const normalizedPath = normalizePath(request.filePath);

  // Sort rules by priority (highest first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (matchPath(normalizedPath, rule.path)) {
      if (rule.operations.includes(request.operation)) {
        const allowed = rule.type === 'allow';
        return {
          allowed,
          reason: rule.reason || `Matched pattern: ${rule.path}`,
          matchedRule: rule,
          severity: allowed ? 'info' : 'violation',
        };
      }
    }
  }

  return {
    allowed: defaultPolicy === 'allow',
    reason: `Default policy: ${defaultPolicy}`,
    severity: defaultPolicy === 'allow' ? 'info' : 'warning',
  };
};

// ───────────────────────────────────────────────────────────────
// TESTS
// ───────────────────────────────────────────────────────────────

describe('Rule Evaluator', () => {
  describe('Path Matching', () => {
    describe('Glob Patterns', () => {
      it('should match single asterisk (*)', () => {
        expect(matchPath('src/app.ts', 'src/*.ts')).toBe(true);
        expect(matchPath('src/utils/helper.ts', 'src/*.ts')).toBe(false);
      });

      it('should match double asterisk (**)', () => {
        expect(matchPath('src/app.ts', 'src/**/*.ts')).toBe(true);
        expect(matchPath('src/utils/helper.ts', 'src/**/*.ts')).toBe(true);
        expect(matchPath('src/a/b/c/deep.ts', 'src/**/*.ts')).toBe(true);
      });

      it('should match question mark (?)', () => {
        expect(matchPath('file1.ts', 'file?.ts')).toBe(true);
        expect(matchPath('filea.ts', 'file?.ts')).toBe(true);
        expect(matchPath('file12.ts', 'file?.ts')).toBe(false);
      });

      it('should match character classes [abc]', () => {
        expect(matchPath('filea.ts', 'file[abc].ts')).toBe(true);
        expect(matchPath('fileb.ts', 'file[abc].ts')).toBe(true);
        expect(matchPath('filed.ts', 'file[abc].ts')).toBe(false);
      });

      it('should match character ranges [0-9]', () => {
        expect(matchPath('file1.ts', 'file[0-9].ts')).toBe(true);
        expect(matchPath('file9.ts', 'file[0-9].ts')).toBe(true);
        expect(matchPath('filea.ts', 'file[0-9].ts')).toBe(false);
      });

      it('should match brace expansion {a,b}', () => {
        expect(matchPath('file.ts', '*.{ts,tsx}')).toBe(true);
        expect(matchPath('file.tsx', '*.{ts,tsx}')).toBe(true);
        expect(matchPath('file.js', '*.{ts,tsx}')).toBe(false);
      });
    });

    describe('Nested Directories', () => {
      it('should match files in nested directories', () => {
        const pattern = 'src/**';
        expect(matchPath('src/app.ts', pattern)).toBe(true);
        expect(matchPath('src/components/Button.tsx', pattern)).toBe(true);
        expect(matchPath('src/utils/api/client.ts', pattern)).toBe(true);
      });

      it('should not match outside of pattern scope', () => {
        const pattern = 'src/**';
        expect(matchPath('lib/utils.ts', pattern)).toBe(false);
        expect(matchPath('test/app.test.ts', pattern)).toBe(false);
      });

      it('should handle src/components/Button.tsx vs src/**', () => {
        expect(matchPath('src/components/Button.tsx', 'src/**')).toBe(true);
        expect(matchPath('src/components/Button.tsx', 'src/**/*.tsx')).toBe(true);
        expect(matchPath('src/components/Button.tsx', 'src/*.tsx')).toBe(false);
      });
    });

    describe('Exact Matches vs Patterns', () => {
      it('should match exact file paths', () => {
        expect(matchPath('package.json', 'package.json')).toBe(true);
        expect(matchPath('package-lock.json', 'package.json')).toBe(false);
      });

      it('should differentiate between exact and pattern', () => {
        expect(matchPath('.env', '.env')).toBe(true);
        expect(matchPath('.env.local', '.env')).toBe(false);
        expect(matchPath('.env.local', '.env*')).toBe(true);
      });
    });

    describe('Dot Files', () => {
      it('should match .env files', () => {
        expect(matchPath('.env', '.env*')).toBe(true);
        expect(matchPath('.env.local', '.env*')).toBe(true);
        expect(matchPath('.env.production', '.env*')).toBe(true);
        expect(matchPath('.env.development.local', '.env*')).toBe(true);
      });

      it('should match hidden directories', () => {
        expect(matchPath('.git/config', '.git/**')).toBe(true);
        expect(matchPath('.vscode/settings.json', '.vscode/**')).toBe(true);
      });
    });

    describe('Unicode Paths', () => {
      it('should handle unicode characters in paths', () => {
        expect(matchPath('src/日本語.ts', 'src/*.ts')).toBe(true);
        expect(matchPath('src/файл.ts', 'src/**/*.ts')).toBe(true);
        expect(matchPath('文档/readme.md', '文档/*.md')).toBe(true);
      });
    });

    describe('Cross-Platform Paths', () => {
      it('should normalize backslashes to forward slashes', () => {
        expect(normalizePath('src\\app.ts')).toBe('src/app.ts');
        expect(normalizePath('src\\utils\\helper.ts')).toBe('src/utils/helper.ts');
      });

      it('should match paths with backslashes after normalization', () => {
        expect(matchPath('src\\app.ts', 'src/*.ts')).toBe(true);
        expect(matchPath('src\\utils\\helper.ts', 'src/**/*.ts')).toBe(true);
      });
    });
  });

  describe('Priority Ordering', () => {
    it('should evaluate higher priority rules first', () => {
      const rules: Rule[] = [
        { path: '**/*', type: 'deny', operations: ['read'], priority: 0, reason: 'Default deny' },
        { path: 'src/**', type: 'allow', operations: ['read'], priority: 10, reason: 'Allow src' },
      ];

      const result = evaluateAccess(
        { filePath: 'src/app.ts', operation: 'read' },
        rules,
        'deny'
      );

      expect(result.allowed).toBe(true);
      expect(result.matchedRule?.priority).toBe(10);
    });

    it('should use first matching rule at same priority', () => {
      const rules: Rule[] = [
        { path: 'src/**', type: 'deny', operations: ['read'], priority: 10, reason: 'Deny src' },
        { path: 'src/app.ts', type: 'allow', operations: ['read'], priority: 10, reason: 'Allow app.ts' },
      ];

      const result = evaluateAccess(
        { filePath: 'src/app.ts', operation: 'read' },
        rules,
        'allow'
      );

      // First matching rule wins at same priority
      expect(result.allowed).toBe(false);
    });

    it('should fall back to default policy when no rules match', () => {
      const rules: Rule[] = [
        { path: 'src/**', type: 'allow', operations: ['read'], priority: 10 },
      ];

      const resultDeny = evaluateAccess(
        { filePath: 'lib/utils.ts', operation: 'read' },
        rules,
        'deny'
      );

      const resultAllow = evaluateAccess(
        { filePath: 'lib/utils.ts', operation: 'read' },
        rules,
        'allow'
      );

      expect(resultDeny.allowed).toBe(false);
      expect(resultAllow.allowed).toBe(true);
    });
  });

  describe('Operation Matching', () => {
    it('should match specific operations', () => {
      const rules: Rule[] = [
        { path: 'src/**', type: 'allow', operations: ['read', 'write'], priority: 10 },
      ];

      expect(evaluateAccess({ filePath: 'src/app.ts', operation: 'read' }, rules, 'deny').allowed).toBe(true);
      expect(evaluateAccess({ filePath: 'src/app.ts', operation: 'write' }, rules, 'deny').allowed).toBe(true);
      expect(evaluateAccess({ filePath: 'src/app.ts', operation: 'delete' }, rules, 'deny').allowed).toBe(false);
    });

    it('should handle all operations', () => {
      const rules: Rule[] = [
        { path: 'temp/**', type: 'allow', operations: ['read', 'write', 'delete', 'execute', 'list'], priority: 10 },
      ];

      const operations: Array<'read' | 'write' | 'delete' | 'execute' | 'list'> =
        ['read', 'write', 'delete', 'execute', 'list'];

      for (const op of operations) {
        const result = evaluateAccess({ filePath: 'temp/file.txt', operation: op }, rules, 'deny');
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle .env protection with src access', () => {
      const rules: Rule[] = [
        { path: '.env*', type: 'deny', operations: ['read', 'write', 'delete'], priority: 100, reason: 'Protect secrets' },
        { path: 'src/**', type: 'allow', operations: ['read', 'write'], priority: 10, reason: 'Source code' },
        { path: '**/*', type: 'deny', operations: ['read', 'write', 'delete'], priority: 0, reason: 'Default deny' },
      ];

      // .env should be blocked
      expect(evaluateAccess({ filePath: '.env', operation: 'read' }, rules, 'deny').allowed).toBe(false);
      expect(evaluateAccess({ filePath: '.env.local', operation: 'read' }, rules, 'deny').allowed).toBe(false);

      // src should be allowed
      expect(evaluateAccess({ filePath: 'src/app.ts', operation: 'read' }, rules, 'deny').allowed).toBe(true);
      expect(evaluateAccess({ filePath: 'src/utils/api.ts', operation: 'write' }, rules, 'deny').allowed).toBe(true);

      // other files should be blocked
      expect(evaluateAccess({ filePath: 'config/database.yml', operation: 'read' }, rules, 'deny').allowed).toBe(false);
    });

    it('should handle node_modules restrictions', () => {
      const rules: Rule[] = [
        { path: 'node_modules/**', type: 'allow', operations: ['read'], priority: 10, reason: 'Read dependencies' },
        { path: 'node_modules/**', type: 'deny', operations: ['write', 'delete'], priority: 10, reason: 'Protect dependencies' },
      ];

      expect(evaluateAccess({ filePath: 'node_modules/lodash/index.js', operation: 'read' }, rules, 'deny').allowed).toBe(true);
      expect(evaluateAccess({ filePath: 'node_modules/lodash/index.js', operation: 'write' }, rules, 'deny').allowed).toBe(false);
      expect(evaluateAccess({ filePath: 'node_modules/lodash/index.js', operation: 'delete' }, rules, 'deny').allowed).toBe(false);
    });
  });
});
