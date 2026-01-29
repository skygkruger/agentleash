// ═══════════════════════════════════════════════════════════════
// AGENTLEASH WATCH COMMAND
// Start monitoring file operations
// ═══════════════════════════════════════════════════════════════

import * as path from 'path';
import chokidar from 'chokidar';
import { minimatch } from 'minimatch';
import WebSocket from 'ws';
import ui from '../utils/ui';
import { findConfig, loadConfig, ScopeConfig, Rule } from '../utils/config';
import auth from '../utils/auth';
import { ReadDetector } from '../utils/read-detector';
import { PermissionEnforcer } from './enforcer';
import { InteractivePrompter } from './interactive';
import { AgentVerifier } from './agent-verifier';

type MonitorMode = 'passive' | 'active' | 'interactive';

// Agent display names — IDs match VaultAgent for cross-product compatibility
const AGENT_NAMES: Record<string, string> = {
  'claude-code': 'Claude Code',
  'cursor': 'Cursor',
  'windsurf': 'Windsurf',
  'aider': 'Aider',
  'github-copilot': 'GitHub Copilot',
  'continue': 'Continue',
};

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

interface WatchStats {
  total: number;
  allowed: number;
  blocked: number;
  warnings: number;
  startTime: Date;
}

// ───────────────────────────────────────────────────────────────
// LOG BATCHER - Batches events before sending to reduce network calls
// ───────────────────────────────────────────────────────────────

class LogBatcher {
  private buffer: Array<{
    filePath: string;
    operation: string;
    result: string;
    matchedRule?: string;
    agentIdentifier?: string;
    timestamp: string;
  }> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private ws: WebSocket | null = null;

  // Configuration
  private readonly MAX_BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

  constructor(ws: WebSocket | null) {
    this.ws = ws;
    this.startFlushTimer();
  }

  add(event: {
    filePath: string;
    operation: string;
    result: string;
    matchedRule?: string;
    agentIdentifier?: string;
    timestamp: string;
  }): void {
    this.buffer.push(event);

    // Flush immediately if buffer is full
    if (this.buffer.length >= this.MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Clear buffer if not connected (avoid memory buildup)
      if (this.buffer.length > 1000) {
        this.buffer = this.buffer.slice(-100); // Keep last 100
      }
      return;
    }

    // Send batch
    this.ws.send(JSON.stringify({
      type: 'access_batch',
      data: this.buffer,
    }));

    // Clear buffer
    this.buffer = [];
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Final flush before shutdown
    this.flush();
  }

  updateWebSocket(ws: WebSocket | null): void {
    this.ws = ws;
  }
}

// ───────────────────────────────────────────────────────────────
// WATCH COMMAND
// ───────────────────────────────────────────────────────────────

export interface WatchOptions {
  path?: string;
  config?: string;
  agent?: string;
  mode?: string;
  quiet?: boolean;
  sync?: boolean;
}

export async function watchCommand(options: WatchOptions): Promise<void> {
  ui.printBanner();

  // Validate mode
  const mode: MonitorMode = (options.mode as MonitorMode) || 'passive';
  if (!['passive', 'active', 'interactive'].includes(mode)) {
    ui.printError(`Invalid mode: ${options.mode}. Must be passive, active, or interactive.`);
    process.exit(1);
  }

  // Find and load config
  const configPath = options.config || findConfig(options.path);

  if (!configPath) {
    ui.printError('No .agentleash.yml found');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('leash init')} to create a configuration file`);
    process.exit(1);
  }

  let config: ScopeConfig;
  try {
    const loaded = loadConfig(configPath);
    if (!loaded) {
      throw new Error('Failed to load configuration');
    }
    config = loaded;
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to load configuration');
    process.exit(1);
  }

  const watchPath = config.basePath || path.dirname(configPath);

  // Initialize stats
  const stats: WatchStats = {
    total: 0,
    allowed: 0,
    blocked: 0,
    warnings: 0,
    startTime: new Date(),
  };

  // Connect to WebSocket for sync if enabled
  let ws: WebSocket | null = null;
  if (options.sync && config.sync?.enabled && config.sync?.scopeId) {
    ws = connectWebSocket(config.sync.scopeId);
  }

  // Initialize log batcher for efficient cloud sync
  const logBatcher = new LogBatcher(ws);

  // Resolve agent display name
  const agentName = options.agent
    ? (AGENT_NAMES[options.agent] || options.agent)
    : undefined;

  // Print header
  printWatchHeader(config, watchPath, agentName, mode);

  // Agent verification
  let agentVerifier: AgentVerifier | null = null;
  if (options.agent) {
    agentVerifier = new AgentVerifier(options.agent);
    const check = agentVerifier.verify();
    if (check.verified) {
      ui.printSuccess(`Agent verified: ${agentName} (PID: ${check.pid})`);
    } else {
      ui.printWarning(`Agent process not detected — events tagged unverified`);
    }
    agentVerifier.startPeriodicVerification(30000, (result) => {
      if (!result.verified) {
        ui.printWarning(`Agent process no longer detected`);
      }
    });
  }

  // Set up permission enforcer for active mode
  let enforcer: PermissionEnforcer | null = null;
  if (mode === 'active') {
    enforcer = new PermissionEnforcer({
      basePath: watchPath,
      rules: config.rules,
    });
    try {
      await enforcer.activate();
      ui.printWarning('Active mode: deny-rule files locked. Press Ctrl+C to restore.');
    } catch (error) {
      ui.printError(`Failed to activate enforcer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  // Set up interactive prompter
  let prompter: InteractivePrompter | null = null;
  if (mode === 'interactive') {
    if (!process.stdin.isTTY) {
      ui.printWarning('Interactive mode requires a TTY terminal. Falling back to passive mode.');
    } else {
      prompter = new InteractivePrompter();
      ui.printInfo('Interactive mode: will prompt on warn-rule matches.');
    }
  }

  // Set up file watcher
  const ignoredPatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.agentleash.yml',
  ];

  const watcher = chokidar.watch(watchPath, {
    ignored: ignoredPatterns,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  // Handle file events
  const eventHandler = async (filePath: string, operation: 'read' | 'write' | 'delete' | 'list') => {
    const result = handleEvent(filePath, operation, config, stats, options.quiet, logBatcher, options.agent);

    // Interactive mode: prompt on warnings/blocks
    if (prompter && result && (result.result === 'warning' || result.result === 'blocked')) {
      const relativePath = path.relative(process.cwd(), filePath);
      const decision = await prompter.promptForAccess(relativePath, operation);
      if (decision === 'allow' || decision === 'always') {
        if (!options.quiet) {
          console.log(`    ${ui.colors.mint('[/]')} Access approved via prompt`);
        }
        if (enforcer) {
          enforcer.restoreFile(filePath);
        }
      } else {
        if (!options.quiet) {
          console.log(`    ${ui.colors.coral('[X]')} Access denied via prompt`);
        }
      }
    }

    // Active mode: restrict new files matching deny rules
    if (enforcer && operation === 'write') {
      enforcer.onNewFileDetected(filePath);
    }
  };

  watcher.on('add', (filePath) => eventHandler(filePath, 'write'));
  watcher.on('change', (filePath) => eventHandler(filePath, 'write'));
  watcher.on('unlink', (filePath) => eventHandler(filePath, 'delete'));
  watcher.on('addDir', (filePath) => eventHandler(filePath, 'write'));
  watcher.on('unlinkDir', (filePath) => eventHandler(filePath, 'delete'));

  // Set up read detection
  const readDetector = new ReadDetector({
    basePath: watchPath,
    pollIntervalMs: 2000,
    ignored: ignoredPatterns,
  });
  readDetector.on('read', (event: { absolutePath: string }) => {
    eventHandler(event.absolutePath, 'read');
  });
  readDetector.on('warning', (msg: string) => {
    ui.printWarning(msg);
  });
  readDetector.start();

  // Handle ready
  watcher.on('ready', () => {
    if (!options.quiet) {
      ui.printInfo('Watching for file operations...');
      ui.newLine();
    }
  });

  // Handle errors
  watcher.on('error', (error) => {
    ui.printError(`Watcher error: ${error.message}`);
  });

  // Watch for config changes
  const configWatcher = chokidar.watch(configPath, { persistent: true });
  configWatcher.on('change', () => {
    ui.printWarning('Configuration changed - reloading...');
    try {
      const reloaded = loadConfig(configPath);
      if (reloaded) {
        Object.assign(config, reloaded);
        ui.printSuccess('Configuration reloaded');
      }
    } catch (error) {
      ui.printError('Failed to reload configuration');
    }
  });

  // Handle shutdown
  const shutdown = async () => {
    ui.newLine();
    ui.printInfo('Shutting down...');
    readDetector.stop();
    logBatcher.shutdown();
    watcher.close();
    configWatcher.close();
    if (enforcer) {
      await enforcer.deactivate();
      ui.printSuccess('File permissions restored');
    }
    if (prompter) {
      prompter.close();
    }
    if (agentVerifier) {
      agentVerifier.stopPeriodicVerification();
    }
    if (ws) {
      ws.close();
    }
    printSummary(stats);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep the process running
  await new Promise(() => {});
}

// ───────────────────────────────────────────────────────────────
// EVENT HANDLING
// ───────────────────────────────────────────────────────────────

function handleEvent(
  filePath: string,
  operation: 'read' | 'write' | 'delete' | 'list',
  config: ScopeConfig,
  stats: WatchStats,
  quiet?: boolean,
  logBatcher?: LogBatcher,
  agentIdentifier?: string
): EvaluationResult {
  const relativePath = path.relative(process.cwd(), filePath);
  const result = evaluateAccess(relativePath, operation, config);

  stats.total++;
  if (result.result === 'allowed') stats.allowed++;
  else if (result.result === 'blocked') stats.blocked++;
  else stats.warnings++;

  // Print log line
  if (!quiet || result.result !== 'allowed') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(ui.logLine(result.result, operation, relativePath, timestamp));

    if (result.rule?.reason && result.result !== 'allowed') {
      console.log(`    ${ui.colors.muted(result.rule.reason)}`);
    }
  }

  // Add to batch for cloud sync (batches are sent every 5s or when full)
  if (logBatcher) {
    logBatcher.add({
      filePath: relativePath,
      operation,
      result: result.result,
      matchedRule: result.rule?.path,
      agentIdentifier,
      timestamp: new Date().toISOString(),
    });
  }

  return result;
}

// ───────────────────────────────────────────────────────────────
// RULE EVALUATION
// ───────────────────────────────────────────────────────────────

interface EvaluationResult {
  result: 'allowed' | 'blocked' | 'warning';
  rule?: Rule;
}

function evaluateAccess(
  filePath: string,
  operation: string,
  config: ScopeConfig
): EvaluationResult {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check each rule in order
  for (const rule of config.rules) {
    const matches = minimatch(normalizedPath, rule.path, {
      dot: true,
      matchBase: true,
    });

    if (matches) {
      // Check if operation is explicitly denied
      if (rule.deny?.includes(operation as any)) {
        return { result: 'blocked', rule };
      }

      // Check if operation is explicitly allowed
      if (rule.allow?.includes(operation as any)) {
        return { result: 'allowed', rule };
      }
    }
  }

  // Apply default policy
  if (config.defaultPolicy === 'allow') {
    return { result: 'allowed' };
  }

  return { result: 'blocked' };
}

// ───────────────────────────────────────────────────────────────
// WEBSOCKET CONNECTION
// ───────────────────────────────────────────────────────────────

function connectWebSocket(scopeId: string): WebSocket | null {
  const token = auth.getAccessToken() || auth.getApiKey();
  if (!token) {
    ui.printWarning('Not authenticated - sync disabled');
    return null;
  }

  const wsUrl = process.env.AGENTLEASH_WS_URL || 'ws://localhost:3001/ws';

  try {
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ui.printInfo('Connected to AgentLeash cloud');
      ws.send(JSON.stringify({
        type: 'subscribe',
        scopeId,
        token,
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscribed') {
          ui.printSuccess('Syncing with cloud dashboard');
        }
      } catch {
        // Ignore parse errors
      }
    });

    ws.on('error', (error) => {
      ui.printWarning(`WebSocket error: ${error.message}`);
    });

    ws.on('close', () => {
      ui.printInfo('Disconnected from cloud');
    });

    return ws;
  } catch (error) {
    ui.printWarning('Failed to connect to cloud');
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// UI HELPERS
// ───────────────────────────────────────────────────────────────

function printWatchHeader(config: ScopeConfig, watchPath: string, agentName?: string, mode?: MonitorMode): void {
  const modeDisplay = mode === 'active'
    ? ui.colors.coral('ACTIVE')
    : mode === 'interactive'
      ? ui.colors.cream('INTERACTIVE')
      : ui.colors.mint('PASSIVE');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('AGENTLEASH')}                                          [${ui.colors.mint('WATCHING')}]   ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Scope:  ${ui.colors.text(config.name.padEnd(66))} ║`);
  console.log(`║  Path:   ${ui.colors.muted(truncatePath(watchPath, 66).padEnd(66))} ║`);
  console.log(`║  Policy: ${config.defaultPolicy === 'deny' ? ui.colors.coral('DENY') : ui.colors.mint('ALLOW')}${' '.repeat(62)} ║`);
  console.log(`║  Mode:   ${modeDisplay}${' '.repeat(62)} ║`);
  console.log(`║  Rules:  ${ui.colors.lavender(config.rules.length.toString())} configured${' '.repeat(55)} ║`);
  if (agentName) {
    console.log(`║  Agent:  ${ui.colors.cyan(agentName.padEnd(66))} ║`);
  }
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Press ${ui.colors.cream('Ctrl+C')} to stop                                                      ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  ui.newLine();
}

function printSummary(stats: WatchStats): void {
  const duration = Math.round((Date.now() - stats.startTime.getTime()) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  ui.newLine();
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('SESSION SUMMARY')}                                                            ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Duration: ${ui.colors.text(`${minutes}m ${seconds}s`.padEnd(64))} ║`);
  console.log(`║  Total:    ${ui.colors.text(stats.total.toString().padEnd(64))} ║`);
  console.log(`║  Allowed:  ${ui.colors.mint(stats.allowed.toString().padEnd(64))} ║`);
  console.log(`║  Blocked:  ${ui.colors.coral(stats.blocked.toString().padEnd(64))} ║`);
  console.log(`║  Warnings: ${ui.colors.cream(stats.warnings.toString().padEnd(64))} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
}

function truncatePath(p: string, maxLength: number): string {
  if (p.length <= maxLength) return p;
  return '...' + p.slice(-(maxLength - 3));
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default watchCommand;
