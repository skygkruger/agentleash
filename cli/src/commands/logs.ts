// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT LOGS COMMAND
// View access logs from cloud
// ═══════════════════════════════════════════════════════════════

import ui from '../utils/ui';
import { findConfig, loadConfig, ScopeConfig } from '../utils/config';
import auth from '../utils/auth';
import api, { LogData } from '../utils/api';

// ───────────────────────────────────────────────────────────────
// LOGS COMMAND
// ───────────────────────────────────────────────────────────────

export interface LogsOptions {
  limit?: string;
  operation?: string;
  result?: string;
  config?: string;
  json?: boolean;
  follow?: boolean;
}

export async function logsCommand(options: LogsOptions): Promise<void> {
  if (!options.json) {
    ui.printBanner();
  }

  // Check authentication
  if (!auth.isAuthenticated()) {
    ui.printError('Authentication required');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent login')} first`);
    process.exit(1);
  }

  // Find and load config to get scope ID
  const configPath = options.config || findConfig();
  let scopeId: string | undefined;

  if (configPath) {
    try {
      const config = loadConfig(configPath);
      if (config?.sync?.scopeId) {
        scopeId = config.sync.scopeId;
      }
    } catch {
      // Ignore config errors
    }
  }

  if (!scopeId) {
    // Try to get first scope from cloud
    const scopesResult = await api.listScopes();
    if (scopesResult.success && scopesResult.data && scopesResult.data.length > 0) {
      scopeId = scopesResult.data[0].id;
      if (!options.json) {
        ui.printInfo(`Using scope: ${scopesResult.data[0].name}`);
        ui.newLine();
      }
    } else {
      ui.printError('No scopes found. Create a scope first.');
      process.exit(1);
    }
  }

  const limit = parseInt(options.limit || '50', 10);

  if (!options.json) {
    const spinner = ui.spinner('Fetching logs...');
    spinner.start();

    const result = await api.listLogs(scopeId, {
      limit,
      operation: options.operation,
      result: options.result,
    });

    if (!result.success) {
      spinner.fail(ui.colors.coral('Failed to fetch logs'));
      ui.printError(result.error || 'Unknown error');
      process.exit(1);
    }

    spinner.succeed(ui.colors.mint(`Fetched ${(result.data as any)?.logs?.length || 0} logs`));
    ui.newLine();

    const logs = (result.data as any)?.logs || [];
    displayLogs(logs);

    // Show total
    ui.newLine();
    ui.printInfo(`Showing ${logs.length} of ${(result.data as any)?.total || 0} total logs`);

    if ((result.data as any)?.hasMore) {
      console.log(`${ui.colors.muted('Use')} ${ui.colors.cyan('--limit')} ${ui.colors.muted('to see more')}`);
    }
  } else {
    // JSON output
    const result = await api.listLogs(scopeId, {
      limit,
      operation: options.operation,
      result: options.result,
    });

    if (!result.success) {
      console.log(JSON.stringify({ error: result.error }, null, 2));
      process.exit(1);
    }

    console.log(JSON.stringify(result.data, null, 2));
  }
}

// ───────────────────────────────────────────────────────────────
// STATS COMMAND
// ───────────────────────────────────────────────────────────────

export interface StatsOptions {
  period?: string;
  config?: string;
  json?: boolean;
}

export async function statsCommand(options: StatsOptions): Promise<void> {
  if (!options.json) {
    ui.printBanner();
  }

  // Check authentication
  if (!auth.isAuthenticated()) {
    ui.printError('Authentication required');
    process.exit(1);
  }

  // Find scope ID
  const configPath = options.config || findConfig();
  let scopeId: string | undefined;

  if (configPath) {
    try {
      const config = loadConfig(configPath);
      if (config?.sync?.scopeId) {
        scopeId = config.sync.scopeId;
      }
    } catch {
      // Ignore
    }
  }

  if (!scopeId) {
    const scopesResult = await api.listScopes();
    if (scopesResult.success && scopesResult.data && scopesResult.data.length > 0) {
      scopeId = scopesResult.data[0].id;
    } else {
      ui.printError('No scopes found');
      process.exit(1);
    }
  }

  const period = (options.period || 'day') as 'hour' | 'day' | 'week' | 'month';

  if (!options.json) {
    const spinner = ui.spinner('Fetching stats...');
    spinner.start();

    const result = await api.getLogStats(scopeId, period);

    if (!result.success) {
      spinner.fail(ui.colors.coral('Failed to fetch stats'));
      ui.printError(result.error || 'Unknown error');
      process.exit(1);
    }

    spinner.succeed(ui.colors.mint('Stats retrieved'));
    ui.newLine();

    displayStats(result.data!);
  } else {
    const result = await api.getLogStats(scopeId, period);

    if (!result.success) {
      console.log(JSON.stringify({ error: result.error }, null, 2));
      process.exit(1);
    }

    console.log(JSON.stringify(result.data, null, 2));
  }
}

// ───────────────────────────────────────────────────────────────
// DISPLAY HELPERS
// ───────────────────────────────────────────────────────────────

function displayLogs(logs: LogData[]): void {
  if (logs.length === 0) {
    ui.printInfo('No logs found');
    return;
  }

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('ACCESS LOGS')}                                                                ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  for (const log of logs) {
    const timestamp = new Date(log.createdAt).toLocaleString();
    const icon =
      log.result === 'allowed'
        ? ui.icons.allowed
        : log.result === 'blocked'
        ? ui.icons.blocked
        : ui.icons.warning;

    const resultColor =
      log.result === 'allowed'
        ? ui.colors.mint
        : log.result === 'blocked'
        ? ui.colors.coral
        : ui.colors.cream;

    const opText = ui.colors.lavender(log.operation.toUpperCase().padEnd(7));
    const resultText = resultColor(log.result.toUpperCase().padEnd(8));
    const pathText = truncate(log.filePath, 40);

    console.log(`║  ${icon} ${opText} ${resultText} ${ui.colors.text(pathText.padEnd(40))} ║`);
    console.log(`║     ${ui.colors.muted(timestamp.padEnd(71))} ║`);

    if (log.agentIdentifier) {
      console.log(`║     ${ui.colors.muted(`Agent: ${log.agentIdentifier}`.padEnd(71))} ║`);
    }

    console.log('║                                                                              ║');
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
}

function displayStats(stats: {
  period: string;
  total: number;
  allowed: number;
  blocked: number;
  warnings: number;
  operations: Record<string, number>;
}): void {
  const periodLabels: Record<string, string> = {
    hour: 'Last Hour',
    day: 'Last 24 Hours',
    week: 'Last 7 Days',
    month: 'Last 30 Days',
  };

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('STATISTICS')} - ${ui.colors.text(periodLabels[stats.period] || stats.period)}${' '.repeat(46 - (periodLabels[stats.period] || stats.period).length)} ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  // Summary
  console.log(`║  ${ui.icons.info} Total:     ${ui.colors.text(stats.total.toString().padEnd(62))} ║`);
  console.log(`║  ${ui.icons.allowed} Allowed:   ${ui.colors.mint(stats.allowed.toString().padEnd(62))} ║`);
  console.log(`║  ${ui.icons.blocked} Blocked:   ${ui.colors.coral(stats.blocked.toString().padEnd(62))} ║`);
  console.log(`║  ${ui.icons.warning} Warnings:  ${ui.colors.cream(stats.warnings.toString().padEnd(62))} ║`);

  // Operations breakdown
  if (Object.keys(stats.operations).length > 0) {
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  ${ui.colors.text('Operations breakdown:')}${' '.repeat(54)} ║`);

    for (const [op, count] of Object.entries(stats.operations)) {
      const bar = createBar(count, stats.total, 30);
      const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      console.log(`║    ${ui.colors.lavender(op.toUpperCase().padEnd(8))} ${bar} ${ui.colors.text(`${count} (${percentage}%)`).padEnd(20)} ║`);
    }
  }

  // Block rate
  if (stats.total > 0) {
    const blockRate = Math.round((stats.blocked / stats.total) * 100);
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  ${ui.icons.config} Block Rate: ${blockRate}%${' '.repeat(60 - blockRate.toString().length)} ║`);
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
}

function createBar(value: number, max: number, width: number): string {
  if (max === 0) return ui.colors.muted('░'.repeat(width));

  const filled = Math.round((value / max) * width);
  const empty = width - filled;

  return ui.colors.amber('█'.repeat(filled)) + ui.colors.muted('░'.repeat(empty));
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  logs: logsCommand,
  stats: statsCommand,
};
