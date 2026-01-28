// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT RULE EVALUATOR
// Evaluates file access requests against scope rules
// ═══════════════════════════════════════════════════════════════

import * as path from 'path';
import { minimatch } from 'minimatch';
import type { ParsedRule, Operation, ScopeConfig } from '../config/parser';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface AccessRequest {
  filePath: string;
  operation: Operation;
  agentIdentifier?: string;
  processName?: string;
  processPid?: number;
  timestamp?: Date;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedRule?: ParsedRule;
  severity: 'info' | 'warning' | 'violation';
  defaultPolicyApplied: boolean;
}

export interface AccessLog {
  id: string;
  request: AccessRequest;
  decision: AccessDecision;
  timestamp: Date;
}

export interface Violation {
  id: string;
  type: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedPaths: string[];
  timestamp: Date;
  request?: AccessRequest;
}

export type ViolationType =
  | 'path_breach'
  | 'mass_delete'
  | 'config_access'
  | 'env_access'
  | 'key_access'
  | 'path_escape'
  | 'unauthorized_write'
  | 'unauthorized_execute';

// ───────────────────────────────────────────────────────────────
// RULE EVALUATOR CLASS
// ───────────────────────────────────────────────────────────────

export class RuleEvaluator {
  private rules: ParsedRule[] = [];
  private basePath: string;
  private defaultPolicy: 'allow' | 'deny';
  private recentAccess: AccessLog[] = [];
  private readonly maxRecentAccess = 1000;

  constructor(config: {
    rules: ParsedRule[];
    basePath: string;
    defaultPolicy: 'allow' | 'deny';
  }) {
    this.rules = config.rules;
    this.basePath = path.resolve(config.basePath);
    this.defaultPolicy = config.defaultPolicy;
  }

  // ─────────────────────────────────────────────────────────────
  // EVALUATE ACCESS
  // ─────────────────────────────────────────────────────────────

  evaluateAccess(request: AccessRequest): AccessDecision {
    // Normalize the file path
    const normalizedPath = this.normalizePath(request.filePath);
    const relativePath = this.getRelativePath(normalizedPath);

    // Check if path is outside base path
    if (this.isPathEscape(normalizedPath)) {
      return {
        allowed: false,
        reason: 'Path is outside the scope base directory',
        severity: 'violation',
        defaultPolicyApplied: false,
      };
    }

    // Find matching rule
    const matchedRule = this.findMatchingRule(relativePath, request.operation);

    if (matchedRule) {
      const allowed = this.isOperationAllowed(matchedRule, request.operation);
      const severity = this.getSeverity(allowed, matchedRule, request);

      return {
        allowed,
        reason: matchedRule.reason || `Matched rule: ${matchedRule.path}`,
        matchedRule,
        severity,
        defaultPolicyApplied: false,
      };
    }

    // Apply default policy
    const allowed = this.defaultPolicy === 'allow';
    return {
      allowed,
      reason: `Default policy: ${this.defaultPolicy}`,
      severity: allowed ? 'info' : 'warning',
      defaultPolicyApplied: true,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LOG ACCESS
  // ─────────────────────────────────────────────────────────────

  logAccess(request: AccessRequest, decision: AccessDecision): AccessLog {
    const log: AccessLog = {
      id: this.generateId(),
      request,
      decision,
      timestamp: new Date(),
    };

    this.recentAccess.unshift(log);
    if (this.recentAccess.length > this.maxRecentAccess) {
      this.recentAccess.pop();
    }

    return log;
  }

  // ─────────────────────────────────────────────────────────────
  // MATCH PATH
  // ─────────────────────────────────────────────────────────────

  matchPath(filePath: string, pattern: string): boolean {
    // Normalize paths for cross-platform compatibility
    const normalizedFile = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Use minimatch for glob pattern matching
    return minimatch(normalizedFile, normalizedPattern, {
      dot: true, // Match dotfiles
      matchBase: true, // Match basename if pattern has no slashes
      nocase: process.platform === 'win32', // Case insensitive on Windows
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FIND MATCHING RULE
  // ─────────────────────────────────────────────────────────────

  findMatchingRule(filePath: string, operation: Operation): ParsedRule | undefined {
    // Rules are already sorted by priority/specificity
    for (const rule of this.rules) {
      if (this.matchPath(filePath, rule.path)) {
        // Check if this rule applies to the operation
        const hasAllowForOp = rule.operations.allow.includes(operation);
        const hasDenyForOp = rule.operations.deny.includes(operation);

        if (hasAllowForOp || hasDenyForOp) {
          // Check exceptions
          if (rule.except && rule.except.some((exc) => this.matchPath(filePath, exc))) {
            continue; // Skip this rule, check next
          }
          return rule;
        }
      }
    }
    return undefined;
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITIZE RULES
  // ─────────────────────────────────────────────────────────────

  prioritizeRules(rules: ParsedRule[]): ParsedRule[] {
    return [...rules].sort((a, b) => {
      // 1. Explicit priority
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // 2. Agent-specific rules beat global rules
      if (a.source !== b.source) {
        return a.source === 'agent' ? -1 : 1;
      }

      // 3. More specific patterns take precedence
      return this.getPatternSpecificity(b.path) - this.getPatternSpecificity(a.path);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DETECT SUSPICIOUS PATTERNS
  // ─────────────────────────────────────────────────────────────

  detectSuspiciousPatterns(timeWindowMs: number = 60000): Violation[] {
    const violations: Violation[] = [];
    const now = Date.now();
    const recentLogs = this.recentAccess.filter(
      (log) => now - log.timestamp.getTime() < timeWindowMs
    );

    // Check for mass file deletion
    const deletions = recentLogs.filter(
      (log) => log.request.operation === 'delete' && log.decision.allowed
    );
    if (deletions.length >= 10) {
      violations.push({
        id: this.generateId(),
        type: 'mass_delete',
        severity: 'high',
        description: `Detected ${deletions.length} file deletions in the last minute`,
        affectedPaths: deletions.map((d) => d.request.filePath),
        timestamp: new Date(),
      });
    }

    // Check for multiple .env file access attempts
    const envAccess = recentLogs.filter((log) =>
      /\.env/.test(log.request.filePath)
    );
    if (envAccess.length >= 3) {
      violations.push({
        id: this.generateId(),
        type: 'env_access',
        severity: 'high',
        description: `Multiple attempts to access environment files (${envAccess.length} attempts)`,
        affectedPaths: [...new Set(envAccess.map((e) => e.request.filePath))],
        timestamp: new Date(),
      });
    }

    // Check for key file access attempts
    const keyAccess = recentLogs.filter((log) =>
      /\.(key|pem|p12|pfx)$|id_rsa/.test(log.request.filePath)
    );
    if (keyAccess.length >= 1) {
      violations.push({
        id: this.generateId(),
        type: 'key_access',
        severity: 'critical',
        description: `Attempted to access private key or certificate file`,
        affectedPaths: [...new Set(keyAccess.map((k) => k.request.filePath))],
        timestamp: new Date(),
      });
    }

    // Check for config file modifications
    const configWrites = recentLogs.filter(
      (log) =>
        log.request.operation === 'write' &&
        /\.(config|rc|json|ya?ml)$/.test(log.request.filePath)
    );
    if (configWrites.length >= 5) {
      violations.push({
        id: this.generateId(),
        type: 'config_access',
        severity: 'medium',
        description: `Multiple configuration file modifications (${configWrites.length} files)`,
        affectedPaths: [...new Set(configWrites.map((c) => c.request.filePath))],
        timestamp: new Date(),
      });
    }

    // Check for path escape attempts
    const escapeAttempts = recentLogs.filter(
      (log) => !log.decision.allowed && log.decision.reason.includes('outside')
    );
    if (escapeAttempts.length >= 1) {
      violations.push({
        id: this.generateId(),
        type: 'path_escape',
        severity: 'critical',
        description: `Attempted to access files outside the scope boundary`,
        affectedPaths: [...new Set(escapeAttempts.map((e) => e.request.filePath))],
        timestamp: new Date(),
      });
    }

    return violations;
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE RULES
  // ─────────────────────────────────────────────────────────────

  updateRules(rules: ParsedRule[]): void {
    this.rules = this.prioritizeRules(rules);
  }

  addRule(rule: ParsedRule): void {
    this.rules.push(rule);
    this.rules = this.prioritizeRules(this.rules);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────

  getRules(): ParsedRule[] {
    return this.rules;
  }

  getRecentAccess(limit?: number): AccessLog[] {
    return limit ? this.recentAccess.slice(0, limit) : this.recentAccess;
  }

  getStats(): {
    totalOperations: number;
    allowedOperations: number;
    blockedOperations: number;
    violations: number;
  } {
    const allowed = this.recentAccess.filter((l) => l.decision.allowed).length;
    const blocked = this.recentAccess.filter((l) => !l.decision.allowed).length;
    const violations = this.recentAccess.filter(
      (l) => l.decision.severity === 'violation'
    ).length;

    return {
      totalOperations: this.recentAccess.length,
      allowedOperations: allowed,
      blockedOperations: blocked,
      violations,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────

  private normalizePath(filePath: string): string {
    // Resolve to absolute path
    const absolute = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.basePath, filePath);

    // Normalize path separators and resolve . and ..
    return path.normalize(absolute);
  }

  private getRelativePath(absolutePath: string): string {
    return path.relative(this.basePath, absolutePath).replace(/\\/g, '/');
  }

  private isPathEscape(absolutePath: string): boolean {
    const relative = path.relative(this.basePath, absolutePath);
    return relative.startsWith('..') || path.isAbsolute(relative);
  }

  private isOperationAllowed(rule: ParsedRule, operation: Operation): boolean {
    // Explicit deny takes precedence
    if (rule.operations.deny.includes(operation)) {
      return false;
    }
    // Check explicit allow
    if (rule.operations.allow.includes(operation)) {
      return true;
    }
    // If rule has allow list but operation not in it, deny
    if (rule.operations.allow.length > 0) {
      return false;
    }
    // Default to allow if no explicit allow/deny for this operation
    return true;
  }

  private getSeverity(
    allowed: boolean,
    _rule: ParsedRule,
    request: AccessRequest
  ): 'info' | 'warning' | 'violation' {
    if (allowed) {
      return 'info';
    }

    // Check for high-severity violations
    const isSensitivePath =
      /\.env|\.key|\.pem|id_rsa|secrets?|credentials?|private/i.test(
        request.filePath
      );

    if (isSensitivePath) {
      return 'violation';
    }

    if (request.operation === 'delete' || request.operation === 'execute') {
      return 'violation';
    }

    return 'warning';
  }

  private getPatternSpecificity(pattern: string): number {
    let score = pattern.length;
    score -= (pattern.match(/\*\*/g) || []).length * 10;
    score -= (pattern.match(/(?<!\*)\*(?!\*)/g) || []).length * 5;
    score -= (pattern.match(/\?/g) || []).length * 2;
    score += (pattern.match(/[^/*]+/g) || []).length * 3;
    return score;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ───────────────────────────────────────────────────────────────
// FACTORY FUNCTION
// ───────────────────────────────────────────────────────────────

export function createEvaluator(config: ScopeConfig, rules: ParsedRule[]): RuleEvaluator {
  return new RuleEvaluator({
    rules,
    basePath: config.base_path,
    defaultPolicy: config.default_policy,
  });
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default RuleEvaluator;
