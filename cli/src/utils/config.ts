// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT CONFIG UTILITIES
// Read/write .scopeagent.yml configuration files
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { z } from 'zod';

// ───────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────

export const CONFIG_FILE_NAME = '.scopeagent.yml';
export const CONFIG_VERSION = 1;

// ───────────────────────────────────────────────────────────────
// SCHEMA
// ───────────────────────────────────────────────────────────────

const operationSchema = z.enum(['read', 'write', 'delete', 'execute', 'list']);

const ruleSchema = z.object({
  pattern: z.string(),
  allow: z.array(operationSchema).optional(),
  deny: z.array(operationSchema).optional(),
  reason: z.string().optional(),
});

const configSchema = z.object({
  version: z.number().default(1),
  name: z.string(),
  description: z.string().optional(),
  basePath: z.string().optional(),
  defaultPolicy: z.enum(['allow', 'deny']).default('deny'),
  rules: z.array(ruleSchema).default([]),
  agents: z.array(z.string()).optional(),
  notifications: z
    .object({
      onBlocked: z.boolean().optional(),
      onViolation: z.boolean().optional(),
      slack: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  sync: z
    .object({
      enabled: z.boolean().default(false),
      scopeId: z.string().optional(),
      interval: z.number().optional(),
    })
    .optional(),
});

export type ScopeConfig = z.infer<typeof configSchema>;
export type Rule = z.infer<typeof ruleSchema>;

// ───────────────────────────────────────────────────────────────
// DEFAULT CONFIG
// ───────────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: ScopeConfig = {
  version: CONFIG_VERSION,
  name: 'My Project Scope',
  description: 'ScopeAgent configuration for this project',
  defaultPolicy: 'deny',
  rules: [
    {
      pattern: 'src/**/*',
      allow: ['read', 'write'],
      reason: 'Allow full access to source code',
    },
    {
      pattern: 'tests/**/*',
      allow: ['read', 'write'],
      reason: 'Allow full access to test files',
    },
    {
      pattern: 'docs/**/*',
      allow: ['read', 'write'],
      reason: 'Allow access to documentation',
    },
    {
      pattern: '.env',
      deny: ['read', 'write', 'delete'],
      reason: 'Protect environment variables',
    },
    {
      pattern: '.env.*',
      deny: ['read', 'write', 'delete'],
      reason: 'Protect environment files',
    },
    {
      pattern: '**/*.key',
      deny: ['read', 'write', 'delete'],
      reason: 'Protect private keys',
    },
    {
      pattern: '**/*.pem',
      deny: ['read', 'write', 'delete'],
      reason: 'Protect certificates',
    },
    {
      pattern: '**/secrets/**',
      deny: ['read', 'write', 'delete', 'list'],
      reason: 'Protect secrets directory',
    },
    {
      pattern: '**/.git/**',
      deny: ['write', 'delete'],
      allow: ['read'],
      reason: 'Read-only access to git internals',
    },
    {
      pattern: 'node_modules/**',
      deny: ['write', 'delete'],
      allow: ['read'],
      reason: 'Read-only access to dependencies',
    },
  ],
  agents: ['claude-code', 'cursor'],
  notifications: {
    onBlocked: true,
    onViolation: true,
  },
  sync: {
    enabled: false,
  },
};

// ───────────────────────────────────────────────────────────────
// FIND CONFIG
// ───────────────────────────────────────────────────────────────

export function findConfig(startPath: string = process.cwd()): string | null {
  let currentPath = path.resolve(startPath);

  while (currentPath !== path.dirname(currentPath)) {
    const configPath = path.join(currentPath, CONFIG_FILE_NAME);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

export function getConfigPath(directory: string = process.cwd()): string {
  return path.join(path.resolve(directory), CONFIG_FILE_NAME);
}

// ───────────────────────────────────────────────────────────────
// LOAD CONFIG
// ───────────────────────────────────────────────────────────────

export function loadConfig(configPath?: string): ScopeConfig | null {
  const resolvedPath = configPath || findConfig();

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = YAML.parse(content);
    const validated = configSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid config: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}

// ───────────────────────────────────────────────────────────────
// SAVE CONFIG
// ───────────────────────────────────────────────────────────────

export function saveConfig(config: ScopeConfig, configPath: string): void {
  const content = YAML.stringify(config, {
    indent: 2,
    lineWidth: 0,
  });

  const header = `# ═══════════════════════════════════════════════════════════════
# SCOPEAGENT CONFIGURATION
# AI Agent Permission Controller
# ═══════════════════════════════════════════════════════════════
#
# This file defines what paths AI agents can access in your project.
# Documentation: https://scopeagent.io/docs/configuration
#
# ───────────────────────────────────────────────────────────────

`;

  fs.writeFileSync(configPath, header + content, 'utf-8');
}

// ───────────────────────────────────────────────────────────────
// VALIDATE CONFIG
// ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(config: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const validated = configSchema.parse(config);

    // Check for common issues
    if (validated.rules.length === 0) {
      warnings.push('No rules defined - default policy will apply to all paths');
    }

    // Check for conflicting rules
    const patterns = validated.rules.map((r) => r.pattern);
    const duplicates = patterns.filter((p, i) => patterns.indexOf(p) !== i);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate patterns found: ${duplicates.join(', ')}`);
    }

    // Check for overly permissive rules
    const wildcardAllows = validated.rules.filter(
      (r) => r.pattern === '**/*' && r.allow && r.allow.length > 0
    );
    if (wildcardAllows.length > 0) {
      warnings.push('Wildcard allow rule found - this may be overly permissive');
    }

    return { valid: true, errors, warnings };
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const err of error.errors) {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      }
    } else if (error instanceof Error) {
      errors.push(error.message);
    }

    return { valid: false, errors, warnings };
  }
}

// ───────────────────────────────────────────────────────────────
// ADD RULE
// ───────────────────────────────────────────────────────────────

export function addRule(
  config: ScopeConfig,
  rule: Rule
): ScopeConfig {
  return {
    ...config,
    rules: [...config.rules, rule],
  };
}

export function removeRule(
  config: ScopeConfig,
  pattern: string
): ScopeConfig {
  return {
    ...config,
    rules: config.rules.filter((r) => r.pattern !== pattern),
  };
}

// ───────────────────────────────────────────────────────────────
// CONFIG EXISTS
// ───────────────────────────────────────────────────────────────

export function configExists(directory: string = process.cwd()): boolean {
  const configPath = getConfigPath(directory);
  return fs.existsSync(configPath);
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  CONFIG_FILE_NAME,
  CONFIG_VERSION,
  DEFAULT_CONFIG,
  findConfig,
  getConfigPath,
  loadConfig,
  saveConfig,
  validateConfig,
  addRule,
  removeRule,
  configExists,
};
