// ═══════════════════════════════════════════════════════════════
// CONFIG TESTS
// Tests for YAML configuration parsing
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from '@jest/globals';
import * as yaml from 'yaml';
import { z } from 'zod';

// ───────────────────────────────────────────────────────────────
// SCHEMAS
// ───────────────────────────────────────────────────────────────

const ruleSchema = z.object({
  path: z.string(),
  allow: z.array(z.enum(['read', 'write', 'delete', 'execute', 'list'])).optional(),
  deny: z.array(z.enum(['read', 'write', 'delete', 'execute', 'list'])).optional(),
  reason: z.string().optional(),
  except: z.array(z.string()).optional(),
});

const agentConfigSchema = z.object({
  rules: z.array(ruleSchema).optional(),
});

const alertsConfigSchema = z.object({
  notify_on: z.array(z.string()).optional(),
  webhook_url: z.string().url().nullable().optional(),
});

const configSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(1).max(255),
  base_path: z.string().default('.'),
  default_policy: z.enum(['allow', 'deny']).default('deny'),
  rules: z.array(ruleSchema).optional(),
  agents: z.record(agentConfigSchema).optional(),
  alerts: alertsConfigSchema.optional(),
});

// ───────────────────────────────────────────────────────────────
// PARSER FUNCTIONS
// ───────────────────────────────────────────────────────────────

const parseConfig = (yamlContent: string) => {
  const parsed = yaml.parse(yamlContent);
  return configSchema.parse(parsed);
};

// ───────────────────────────────────────────────────────────────
// TESTS
// ───────────────────────────────────────────────────────────────

describe('Config Parser', () => {
  describe('Basic YAML Parsing', () => {
    it('should parse minimal valid config', () => {
      const config = `
version: 1
name: "my-project-scope"
`;
      const result = parseConfig(config);

      expect(result.version).toBe(1);
      expect(result.name).toBe('my-project-scope');
      expect(result.default_policy).toBe('deny'); // default
    });

    it('should parse full config', () => {
      const config = `
version: 1
name: "my-project-scope"
base_path: "/Users/dev/projects/myapp"
default_policy: deny

rules:
  - path: "src/**"
    allow: [read, write]
    reason: "Source code access"

  - path: ".env*"
    deny: [read, write, delete]
    reason: "Environment files contain secrets"
`;
      const result = parseConfig(config);

      expect(result.version).toBe(1);
      expect(result.name).toBe('my-project-scope');
      expect(result.base_path).toBe('/Users/dev/projects/myapp');
      expect(result.default_policy).toBe('deny');
      expect(result.rules).toHaveLength(2);
    });

    it('should parse agent-specific rules', () => {
      const config = `
version: 1
name: "my-project-scope"

agents:
  claude-code:
    rules:
      - path: "**/*.key"
        deny: [read]
  cursor:
    rules:
      - path: "tests/**"
        allow: [read, write, delete]
`;
      const result = parseConfig(config);

      expect(result.agents).toBeDefined();
      expect(result.agents?.['claude-code']?.rules).toHaveLength(1);
      expect(result.agents?.['cursor']?.rules).toHaveLength(1);
    });

    it('should parse alerts configuration', () => {
      const config = `
version: 1
name: "my-project-scope"

alerts:
  notify_on:
    - config_access
    - mass_delete
    - path_breach
  webhook_url: null
`;
      const result = parseConfig(config);

      expect(result.alerts).toBeDefined();
      expect(result.alerts?.notify_on).toContain('config_access');
      expect(result.alerts?.webhook_url).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should reject config without version', () => {
      const config = `
name: "my-project-scope"
`;
      expect(() => parseConfig(config)).toThrow();
    });

    it('should reject config without name', () => {
      const config = `
version: 1
`;
      expect(() => parseConfig(config)).toThrow();
    });

    it('should reject invalid version', () => {
      const config = `
version: "invalid"
name: "my-project-scope"
`;
      expect(() => parseConfig(config)).toThrow();
    });

    it('should reject invalid default_policy', () => {
      const config = `
version: 1
name: "my-project-scope"
default_policy: "invalid"
`;
      expect(() => parseConfig(config)).toThrow();
    });

    it('should reject invalid operations in rules', () => {
      const config = `
version: 1
name: "my-project-scope"
rules:
  - path: "src/**"
    allow: [read, invalid_operation]
`;
      expect(() => parseConfig(config)).toThrow();
    });

    it('should accept valid operations', () => {
      const config = `
version: 1
name: "my-project-scope"
rules:
  - path: "src/**"
    allow: [read, write, delete, execute, list]
`;
      const result = parseConfig(config);
      expect(result.rules?.[0].allow).toHaveLength(5);
    });
  });

  describe('Rule Parsing', () => {
    it('should parse allow rules', () => {
      const config = `
version: 1
name: "test"
rules:
  - path: "src/**"
    allow: [read, write]
`;
      const result = parseConfig(config);

      expect(result.rules?.[0].path).toBe('src/**');
      expect(result.rules?.[0].allow).toEqual(['read', 'write']);
    });

    it('should parse deny rules', () => {
      const config = `
version: 1
name: "test"
rules:
  - path: ".env*"
    deny: [read, write, delete]
`;
      const result = parseConfig(config);

      expect(result.rules?.[0].path).toBe('.env*');
      expect(result.rules?.[0].deny).toEqual(['read', 'write', 'delete']);
    });

    it('should parse mixed allow/deny rules', () => {
      const config = `
version: 1
name: "test"
rules:
  - path: "node_modules/**"
    allow: [read]
    deny: [write, delete]
`;
      const result = parseConfig(config);

      expect(result.rules?.[0].allow).toEqual(['read']);
      expect(result.rules?.[0].deny).toEqual(['write', 'delete']);
    });

    it('should parse rules with reason', () => {
      const config = `
version: 1
name: "test"
rules:
  - path: ".env*"
    deny: [read]
    reason: "Environment files contain secrets"
`;
      const result = parseConfig(config);

      expect(result.rules?.[0].reason).toBe('Environment files contain secrets');
    });

    it('should parse rules with exceptions', () => {
      const config = `
version: 1
name: "test"
rules:
  - path: ".*"
    deny: [read, write, delete]
    except: [.scopeagent.yml, .gitignore]
`;
      const result = parseConfig(config);

      expect(result.rules?.[0].except).toEqual(['.scopeagent.yml', '.gitignore']);
    });
  });

  describe('Default Values', () => {
    it('should use deny as default policy', () => {
      const config = `
version: 1
name: "test"
`;
      const result = parseConfig(config);
      expect(result.default_policy).toBe('deny');
    });

    it('should use "." as default base_path', () => {
      const config = `
version: 1
name: "test"
`;
      const result = parseConfig(config);
      expect(result.base_path).toBe('.');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rules array', () => {
      const config = `
version: 1
name: "test"
rules: []
`;
      const result = parseConfig(config);
      expect(result.rules).toEqual([]);
    });

    it('should handle empty agents object', () => {
      const config = `
version: 1
name: "test"
agents: {}
`;
      const result = parseConfig(config);
      expect(result.agents).toEqual({});
    });

    it('should handle unicode in name', () => {
      const config = `
version: 1
name: "プロジェクト-scope"
`;
      const result = parseConfig(config);
      expect(result.name).toBe('プロジェクト-scope');
    });

    it('should handle paths with special characters', () => {
      const config = `
version: 1
name: "test"
rules:
  - path: "src/**/*.{ts,tsx}"
    allow: [read]
  - path: "files with spaces/**"
    allow: [read]
`;
      const result = parseConfig(config);
      expect(result.rules?.[0].path).toBe('src/**/*.{ts,tsx}');
      expect(result.rules?.[1].path).toBe('files with spaces/**');
    });
  });
});
