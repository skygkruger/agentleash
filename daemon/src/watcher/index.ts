// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT FILE WATCHER
// Monitors file system operations and evaluates against rules
// ═══════════════════════════════════════════════════════════════

import * as path from 'path';
import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { RuleEvaluator, AccessRequest, AccessDecision, AccessLog, Violation } from '../evaluator/engine';
import type { ParsedRule, Operation } from '../config/parser';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface WatcherConfig {
  basePath: string;
  rules: ParsedRule[];
  defaultPolicy: 'allow' | 'deny';
  ignored?: string[];
  persistent?: boolean;
  debounceMs?: number;
}

export interface WatcherStats {
  isWatching: boolean;
  basePath: string;
  ruleCount: number;
  totalOperations: number;
  allowedOperations: number;
  blockedOperations: number;
  warnings: number;
  violations: number;
  startedAt: Date | null;
  lastActivityAt: Date | null;
}

export interface AccessEvent {
  id: string;
  filePath: string;
  relativePath: string;
  operation: Operation;
  result: 'allowed' | 'blocked' | 'warning';
  reason: string;
  timestamp: Date;
  matchedRule?: ParsedRule;
}

export type WatcherEventType =
  | 'access'
  | 'violation'
  | 'started'
  | 'stopped'
  | 'error'
  | 'config-changed';

// ───────────────────────────────────────────────────────────────
// SCOPE WATCHER CLASS
// ───────────────────────────────────────────────────────────────

export class ScopeWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private evaluator: RuleEvaluator;
  private basePath: string;
  private config: WatcherConfig;
  private isWatching: boolean = false;
  private startedAt: Date | null = null;
  private lastActivityAt: Date | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private stats = {
    totalOperations: 0,
    allowedOperations: 0,
    blockedOperations: 0,
    warnings: 0,
    violations: 0,
  };

  constructor(config: WatcherConfig) {
    super();
    this.config = config;
    this.basePath = path.resolve(config.basePath);
    this.evaluator = new RuleEvaluator({
      rules: config.rules,
      basePath: this.basePath,
      defaultPolicy: config.defaultPolicy,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // START WATCHING
  // ─────────────────────────────────────────────────────────────

  start(): void {
    if (this.isWatching) {
      return;
    }

    const ignored = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      ...(this.config.ignored || []),
    ];

    this.watcher = watch(this.basePath, {
      ignored,
      persistent: this.config.persistent ?? true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: undefined, // Watch all depths
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // File/directory events
    this.watcher.on('add', (filePath) => this.handleEvent(filePath, 'write'));
    this.watcher.on('change', (filePath) => this.handleEvent(filePath, 'write'));
    this.watcher.on('unlink', (filePath) => this.handleEvent(filePath, 'delete'));
    this.watcher.on('addDir', (filePath) => this.handleEvent(filePath, 'write'));
    this.watcher.on('unlinkDir', (filePath) => this.handleEvent(filePath, 'delete'));

    // Watcher events
    this.watcher.on('ready', () => {
      this.isWatching = true;
      this.startedAt = new Date();
      this.emit('started', { basePath: this.basePath });
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // STOP WATCHING
  // ─────────────────────────────────────────────────────────────

  async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    await this.watcher.close();
    this.watcher = null;
    this.isWatching = false;
    this.emit('stopped');
  }

  // ─────────────────────────────────────────────────────────────
  // HANDLE FILE EVENT
  // ─────────────────────────────────────────────────────────────

  private handleEvent(filePath: string, operation: Operation): void {
    const debounceMs = this.config.debounceMs ?? 100;
    const key = `${filePath}:${operation}`;

    // Debounce rapid events on same file
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.processEvent(filePath, operation);
    }, debounceMs);

    this.debounceTimers.set(key, timer);
  }

  private processEvent(filePath: string, operation: Operation): void {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(this.basePath, absolutePath).replace(/\\/g, '/');

    const request: AccessRequest = {
      filePath: absolutePath,
      operation,
      timestamp: new Date(),
    };

    // Evaluate the access
    const decision = this.evaluator.evaluateAccess(request);

    // Log the access
    const log = this.evaluator.logAccess(request, decision);

    // Update stats
    this.updateStats(decision);
    this.lastActivityAt = new Date();

    // Create access event
    const event: AccessEvent = {
      id: log.id,
      filePath: absolutePath,
      relativePath,
      operation,
      result: decision.allowed ? 'allowed' : decision.severity === 'violation' ? 'blocked' : 'warning',
      reason: decision.reason,
      timestamp: new Date(),
      matchedRule: decision.matchedRule,
    };

    // Emit access event
    this.emit('access', event);

    // Check for suspicious patterns
    const violations = this.evaluator.detectSuspiciousPatterns();
    for (const violation of violations) {
      this.stats.violations++;
      this.emit('violation', violation);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SIMULATE READ ACCESS (for when we detect read operations)
  // ─────────────────────────────────────────────────────────────

  simulateRead(filePath: string, agentIdentifier?: string): AccessEvent {
    const absolutePath = path.resolve(this.basePath, filePath);
    const relativePath = path.relative(this.basePath, absolutePath).replace(/\\/g, '/');

    const request: AccessRequest = {
      filePath: absolutePath,
      operation: 'read',
      agentIdentifier,
      timestamp: new Date(),
    };

    const decision = this.evaluator.evaluateAccess(request);
    const log = this.evaluator.logAccess(request, decision);

    this.updateStats(decision);
    this.lastActivityAt = new Date();

    const event: AccessEvent = {
      id: log.id,
      filePath: absolutePath,
      relativePath,
      operation: 'read',
      result: decision.allowed ? 'allowed' : decision.severity === 'violation' ? 'blocked' : 'warning',
      reason: decision.reason,
      timestamp: new Date(),
      matchedRule: decision.matchedRule,
    };

    this.emit('access', event);
    return event;
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE STATS
  // ─────────────────────────────────────────────────────────────

  private updateStats(decision: AccessDecision): void {
    this.stats.totalOperations++;
    if (decision.allowed) {
      this.stats.allowedOperations++;
    } else {
      this.stats.blockedOperations++;
    }
    if (decision.severity === 'warning') {
      this.stats.warnings++;
    }
    if (decision.severity === 'violation') {
      this.stats.violations++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RULE MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  addRule(rule: ParsedRule): void {
    this.evaluator.addRule(rule);
    this.emit('config-changed', { type: 'rule-added', rule });
  }

  removeRule(ruleId: string): boolean {
    const removed = this.evaluator.removeRule(ruleId);
    if (removed) {
      this.emit('config-changed', { type: 'rule-removed', ruleId });
    }
    return removed;
  }

  updateRules(rules: ParsedRule[]): void {
    this.evaluator.updateRules(rules);
    this.emit('config-changed', { type: 'rules-updated', rules });
  }

  // ─────────────────────────────────────────────────────────────
  // TEST PATH
  // ─────────────────────────────────────────────────────────────

  testPath(filePath: string, operation: Operation = 'read'): AccessDecision {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.basePath, filePath);

    return this.evaluator.evaluateAccess({
      filePath: absolutePath,
      operation,
      timestamp: new Date(),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────

  getStats(): WatcherStats {
    return {
      isWatching: this.isWatching,
      basePath: this.basePath,
      ruleCount: this.evaluator.getRules().length,
      totalOperations: this.stats.totalOperations,
      allowedOperations: this.stats.allowedOperations,
      blockedOperations: this.stats.blockedOperations,
      warnings: this.stats.warnings,
      violations: this.stats.violations,
      startedAt: this.startedAt,
      lastActivityAt: this.lastActivityAt,
    };
  }

  getRecentAccess(limit?: number): AccessLog[] {
    return this.evaluator.getRecentAccess(limit);
  }

  getRules(): ParsedRule[] {
    return this.evaluator.getRules();
  }

  getBasePath(): string {
    return this.basePath;
  }

  isActive(): boolean {
    return this.isWatching;
  }
}

// ───────────────────────────────────────────────────────────────
// FACTORY FUNCTION
// ───────────────────────────────────────────────────────────────

export function createWatcher(config: WatcherConfig): ScopeWatcher {
  return new ScopeWatcher(config);
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default ScopeWatcher;
