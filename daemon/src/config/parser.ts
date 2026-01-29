// ═══════════════════════════════════════════════════════════════
// AGENTLEASH CONFIG PARSER
// Parses and validates .agentleash.yml configuration files
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { watch as watchFile } from 'chokidar';
import { z } from 'zod';

// ───────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ───────────────────────────────────────────────────────────────

const OperationSchema = z.enum(['read', 'write', 'delete', 'execute', 'list']);

const RuleSchema = z.object({
  path: z.string(),
  allow: z.array(OperationSchema).optional(),
  deny: z.array(OperationSchema).optional(),
  reason: z.string().optional(),
  except: z.array(z.string()).optional(),
  priority: z.number().optional(),
});

const AgentConfigSchema = z.object({
  rules: z.array(RuleSchema).default([]),
});

const AlertConfigSchema = z.object({
  notify_on: z.array(z.string()).default([]),
  webhook_url: z.string().nullable().optional(),
  slack_webhook: z.string().nullable().optional(),
  mass_operation_threshold: z.number().default(10),
});

const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  file: z.string().nullable().optional(),
  include_process_info: z.boolean().default(true),
  include_timestamps: z.boolean().default(true),
});

const ScopeConfigSchema = z.object({
  version: z.number().default(1),
  name: z.string(),
  base_path: z.string().default('.'),
  default_policy: z.enum(['allow', 'deny']).default('deny'),
  rules: z.array(RuleSchema).default([]),
  agents: z.record(z.string(), AgentConfigSchema).optional(),
  alerts: AlertConfigSchema.optional(),
  logging: LoggingConfigSchema.optional(),
});

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export type Operation = z.infer<typeof OperationSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AlertConfig = z.infer<typeof AlertConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type ScopeConfig = z.infer<typeof ScopeConfigSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedRule extends Rule {
  id: string;
  type: 'allow' | 'deny' | 'mixed';
  operations: {
    allow: Operation[];
    deny: Operation[];
  };
  source: 'global' | 'agent';
  agentId?: string;
}

// ───────────────────────────────────────────────────────────────
// CONFIG PARSER CLASS
// ───────────────────────────────────────────────────────────────

export class ConfigParser {
  private configPath: string;
  private config: ScopeConfig | null = null;
  private watcher: ReturnType<typeof watchFile> | null = null;

  constructor(configPath: string = '.agentleash.yml') {
    this.configPath = path.resolve(configPath);
  }

  // ─────────────────────────────────────────────────────────────
  // PARSE CONFIG
  // ─────────────────────────────────────────────────────────────

  parseConfig(): ScopeConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new ConfigError(
        `Configuration file not found: ${this.configPath}`,
        'FILE_NOT_FOUND'
      );
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');

    let rawConfig: unknown;
    try {
      rawConfig = parseYaml(content);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'YAML_PARSE_ERROR'
      );
    }

    const validation = this.validateConfig(rawConfig);
    if (!validation.valid) {
      throw new ConfigError(
        `Invalid configuration:\n${validation.errors.join('\n')}`,
        'VALIDATION_ERROR'
      );
    }

    this.config = ScopeConfigSchema.parse(rawConfig);

    // Resolve base_path relative to config file location
    if (this.config.base_path === '.') {
      this.config.base_path = path.dirname(this.configPath);
    } else if (!path.isAbsolute(this.config.base_path)) {
      this.config.base_path = path.resolve(
        path.dirname(this.configPath),
        this.config.base_path
      );
    }

    return this.config;
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATE CONFIG
  // ─────────────────────────────────────────────────────────────

  validateConfig(config: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate with Zod
    const result = ScopeConfigSchema.safeParse(config);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      }
      return { valid: false, errors, warnings };
    }

    const parsedConfig = result.data;

    // Additional validation
    if (!parsedConfig.name) {
      errors.push('Config must have a name');
    }

    // Check for conflicting rules
    for (const rule of parsedConfig.rules) {
      if (rule.allow && rule.deny) {
        const overlap = rule.allow.filter((op) => rule.deny?.includes(op));
        if (overlap.length > 0) {
          warnings.push(
            `Rule "${rule.path}": Operations [${overlap.join(', ')}] appear in both allow and deny lists`
          );
        }
      }

      // Validate glob patterns
      if (!this.isValidGlobPattern(rule.path)) {
        errors.push(`Invalid glob pattern: "${rule.path}"`);
      }
    }

    // Check for duplicate paths
    const paths = parsedConfig.rules.map((r) => r.path);
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate rule paths: ${[...new Set(duplicates)].join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // WATCH CONFIG CHANGES
  // ─────────────────────────────────────────────────────────────

  watchConfigChanges(callback: (config: ScopeConfig) => void): void {
    if (this.watcher) {
      this.watcher.close();
    }

    this.watcher = watchFile(this.configPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', () => {
      try {
        const newConfig = this.parseConfig();
        callback(newConfig);
      } catch (error) {
        console.error('[ConfigParser] Error reloading config:', error);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // STOP WATCHING
  // ─────────────────────────────────────────────────────────────

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GET RULES FOR AGENT
  // ─────────────────────────────────────────────────────────────

  getRulesForAgent(agentId?: string): ParsedRule[] {
    if (!this.config) {
      throw new ConfigError('Config not loaded', 'CONFIG_NOT_LOADED');
    }

    const rules: ParsedRule[] = [];

    // Add global rules
    for (let i = 0; i < this.config.rules.length; i++) {
      const rule = this.config.rules[i];
      rules.push(this.parseRule(rule, i, 'global'));
    }

    // Add agent-specific rules if agentId provided
    if (agentId && this.config.agents?.[agentId]) {
      const agentRules = this.config.agents[agentId].rules;
      for (let i = 0; i < agentRules.length; i++) {
        const rule = agentRules[i];
        rules.push(this.parseRule(rule, rules.length + i, 'agent', agentId));
      }
    }

    // Sort by priority (higher first), then by specificity
    return rules.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      // Agent rules take precedence over global rules
      if (a.source !== b.source) {
        return a.source === 'agent' ? -1 : 1;
      }
      // More specific patterns (longer, fewer wildcards) take precedence
      return this.getPatternSpecificity(b.path) - this.getPatternSpecificity(a.path);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MERGE AGENT RULES
  // ─────────────────────────────────────────────────────────────

  mergeAgentRules(globalRules: Rule[], agentRules: Rule[]): ParsedRule[] {
    const merged: ParsedRule[] = [];

    // Parse global rules
    for (let i = 0; i < globalRules.length; i++) {
      merged.push(this.parseRule(globalRules[i], i, 'global'));
    }

    // Parse and add agent rules (they override globals for same paths)
    for (let i = 0; i < agentRules.length; i++) {
      merged.push(this.parseRule(agentRules[i], merged.length + i, 'agent'));
    }

    return merged;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────

  private parseRule(
    rule: Rule,
    index: number,
    source: 'global' | 'agent',
    agentId?: string
  ): ParsedRule {
    const allowOps = rule.allow || [];
    const denyOps = rule.deny || [];

    let type: 'allow' | 'deny' | 'mixed';
    if (allowOps.length > 0 && denyOps.length > 0) {
      type = 'mixed';
    } else if (denyOps.length > 0) {
      type = 'deny';
    } else {
      type = 'allow';
    }

    return {
      ...rule,
      id: `rule-${source}-${index}`,
      type,
      operations: {
        allow: allowOps,
        deny: denyOps,
      },
      source,
      agentId,
    };
  }

  private isValidGlobPattern(pattern: string): boolean {
    // Basic validation - check for obviously invalid patterns
    if (!pattern || pattern.length === 0) return false;

    // Check for unbalanced brackets
    const openBrackets = (pattern.match(/\[/g) || []).length;
    const closeBrackets = (pattern.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) return false;

    const openBraces = (pattern.match(/\{/g) || []).length;
    const closeBraces = (pattern.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) return false;

    return true;
  }

  private getPatternSpecificity(pattern: string): number {
    // Higher score = more specific
    let score = pattern.length;

    // Deduct for wildcards
    score -= (pattern.match(/\*\*/g) || []).length * 10;
    score -= (pattern.match(/(?<!\*)\*(?!\*)/g) || []).length * 5;
    score -= (pattern.match(/\?/g) || []).length * 2;

    // Add for exact path segments
    score += (pattern.match(/[^/*]+/g) || []).length * 3;

    return score;
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────

  getConfig(): ScopeConfig | null {
    return this.config;
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getBasePath(): string {
    return this.config?.base_path || process.cwd();
  }

  getDefaultPolicy(): 'allow' | 'deny' {
    return this.config?.default_policy || 'deny';
  }
}

// ───────────────────────────────────────────────────────────────
// CONFIG ERROR CLASS
// ───────────────────────────────────────────────────────────────

export class ConfigError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}

// ───────────────────────────────────────────────────────────────
// DEFAULT CONFIG TEMPLATE
// ───────────────────────────────────────────────────────────────

export const DEFAULT_CONFIG_TEMPLATE = `# ═══════════════════════════════════════════════════════════════
# AGENTLEASH CONFIGURATION
# AI Agent Permission Controller
# ═══════════════════════════════════════════════════════════════

version: 1
name: "my-project-scope"
base_path: .
default_policy: deny

rules:
  # Source code - full access
  - path: "src/**"
    allow: [read, write]
    reason: "Source code access"

  # Config files - read only
  - path: "*.config.js"
    allow: [read]
    deny: [write, delete]
    reason: "Config files - read only"

  # Environment files - blocked
  - path: ".env*"
    deny: [read, write, delete]
    reason: "Environment secrets"

  # Private keys - blocked
  - path: "**/*.key"
    deny: [read, write, delete]
    reason: "Private keys"

  - path: "**/*.pem"
    deny: [read, write, delete]
    reason: "Certificates"

  # Dependencies - read only
  - path: "node_modules/**"
    allow: [read]
    deny: [write, delete]
    reason: "Dependencies - read only"

  # Tests - full access
  - path: "tests/**"
    allow: [read, write]
    reason: "Test files"

  - path: "**/*.test.ts"
    allow: [read, write]
    reason: "Test files"

alerts:
  notify_on:
    - env_access
    - key_access
    - mass_delete
  webhook_url: null

logging:
  level: info
  include_timestamps: true
`;

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default ConfigParser;
