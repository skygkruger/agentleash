// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT STATUS COMMAND
// Show current scope info and stats
// ═══════════════════════════════════════════════════════════════

import * as path from 'path';
import ui from '../utils/ui';
import { findConfig, loadConfig, validateConfig, ScopeConfig } from '../utils/config';
import auth from '../utils/auth';
import api from '../utils/api';

// ───────────────────────────────────────────────────────────────
// STATUS COMMAND
// ───────────────────────────────────────────────────────────────

export interface StatusOptions {
  config?: string;
  cloud?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  ui.printBanner();

  // Find and load config
  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printWarning('No .scopeagent.yml found in current directory or parent directories');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent init')} to create a configuration file`);
    ui.newLine();

    // Still show auth status
    showAuthStatus();
    return;
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

  // Validate config
  const validation = validateConfig(config);

  // Print local status
  printLocalStatus(config, configPath, validation);

  // Show auth status
  ui.newLine();
  showAuthStatus();

  // Show cloud status if requested or sync is enabled
  if (options.cloud || config.sync?.enabled) {
    ui.newLine();
    await showCloudStatus(config);
  }
}

// ───────────────────────────────────────────────────────────────
// LOCAL STATUS
// ───────────────────────────────────────────────────────────────

function printLocalStatus(
  config: ScopeConfig,
  configPath: string,
  validation: { valid: boolean; errors: string[]; warnings: string[] }
): void {
  const validIcon = validation.valid ? ui.icons.allowed : ui.icons.blocked;
  const validText = validation.valid ? ui.colors.mint('Valid') : ui.colors.coral('Invalid');

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('LOCAL CONFIGURATION')}                                                        ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  ${ui.icons.config} Name:     ${ui.colors.text(config.name.padEnd(63))} ║`);

  if (config.description) {
    const desc = config.description.length > 60
      ? config.description.slice(0, 57) + '...'
      : config.description;
    console.log(`║  ${ui.icons.info} Desc:     ${ui.colors.muted(desc.padEnd(63))} ║`);
  }

  console.log(`║  ${ui.icons.action} Policy:   ${config.defaultPolicy === 'deny' ? ui.colors.coral('DENY') : ui.colors.mint('ALLOW')}${' '.repeat(58)} ║`);
  console.log(`║  ${ui.icons.watching} Rules:    ${ui.colors.lavender(config.rules.length.toString())} configured${' '.repeat(52)} ║`);
  console.log(`║  ${validIcon} Status:   ${validText}${' '.repeat(58 - validText.length + 12)} ║`);

  const configDir = path.dirname(configPath);
  console.log(`║  ${ui.icons.info} Path:     ${ui.colors.muted(truncate(configDir, 63).padEnd(63))} ║`);

  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  // Show rule breakdown
  const allowRules = config.rules.filter((r) => r.allow && r.allow.length > 0).length;
  const denyRules = config.rules.filter((r) => r.deny && r.deny.length > 0).length;

  console.log(`║  ${ui.colors.text('Rules breakdown:')}${' '.repeat(60)} ║`);
  console.log(`║    ${ui.icons.allowed} Allow rules: ${ui.colors.mint(allowRules.toString().padEnd(58))} ║`);
  console.log(`║    ${ui.icons.blocked} Deny rules:  ${ui.colors.coral(denyRules.toString().padEnd(58))} ║`);

  // Show agents
  if (config.agents && config.agents.length > 0) {
    console.log(`║    ${ui.icons.info} Agents:      ${ui.colors.lavender(config.agents.join(', ').padEnd(58))} ║`);
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // Show validation warnings
  if (validation.warnings.length > 0) {
    ui.newLine();
    ui.printWarning('Configuration warnings:');
    for (const warning of validation.warnings) {
      console.log(`  ${ui.colors.cream('•')} ${ui.colors.muted(warning)}`);
    }
  }

  // Show validation errors
  if (validation.errors.length > 0) {
    ui.newLine();
    ui.printError('Configuration errors:');
    for (const error of validation.errors) {
      console.log(`  ${ui.colors.coral('•')} ${ui.colors.text(error)}`);
    }
  }
}

// ───────────────────────────────────────────────────────────────
// AUTH STATUS
// ───────────────────────────────────────────────────────────────

function showAuthStatus(): void {
  const isAuthenticated = auth.isAuthenticated();
  const user = auth.getUser();
  const hasApiKey = !!auth.getApiKey();

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('AUTHENTICATION')}                                                             ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  if (isAuthenticated) {
    const icon = ui.icons.allowed;
    console.log(`║  ${icon} Status:   ${ui.colors.mint('Authenticated')}${' '.repeat(52)} ║`);

    if (user) {
      console.log(`║  ${ui.icons.info} Email:    ${ui.colors.text(user.email.padEnd(63))} ║`);
      console.log(`║  ${ui.icons.config} Plan:     ${ui.colors.lavender(user.plan.toUpperCase().padEnd(63))} ║`);
    }

    if (hasApiKey) {
      console.log(`║  ${ui.icons.action} Method:   ${ui.colors.muted('API Key'.padEnd(63))} ║`);
    } else {
      console.log(`║  ${ui.icons.action} Method:   ${ui.colors.muted('Access Token'.padEnd(63))} ║`);
    }
  } else {
    const icon = ui.icons.blocked;
    console.log(`║  ${icon} Status:   ${ui.colors.coral('Not authenticated')}${' '.repeat(49)} ║`);
    console.log(`║  ${ui.icons.help} Run:      ${ui.colors.cyan('scopeagent login').padEnd(63)} ║`);
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
}

// ───────────────────────────────────────────────────────────────
// CLOUD STATUS
// ───────────────────────────────────────────────────────────────

async function showCloudStatus(config: ScopeConfig): Promise<void> {
  if (!auth.isAuthenticated()) {
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log(`║  ${ui.colors.amber('CLOUD STATUS')}                                                               ║`);
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  ${ui.icons.warning} Authentication required for cloud features                                  ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    return;
  }

  const spinner = ui.spinner('Fetching cloud status...');
  spinner.start();

  // Check API health
  const health = await api.healthCheck();

  if (!health.success) {
    spinner.fail(ui.colors.coral('Could not connect to cloud'));
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log(`║  ${ui.colors.amber('CLOUD STATUS')}                                                               ║`);
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  ${ui.icons.blocked} API:      ${ui.colors.coral('Unreachable')}${' '.repeat(54)} ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    return;
  }

  spinner.succeed(ui.colors.mint('Connected to cloud'));

  // Get scopes
  const scopesResult = await api.listScopes();

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('CLOUD STATUS')}                                                               ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  ${ui.icons.allowed} API:      ${ui.colors.mint('Connected')}${' '.repeat(55)} ║`);
  console.log(`║  ${ui.icons.info} Database: ${health.data?.database === 'connected' ? ui.colors.mint('Connected') : ui.colors.coral('Disconnected')}${' '.repeat(51)} ║`);

  if (scopesResult.success && scopesResult.data) {
    console.log(`║  ${ui.icons.config} Scopes:   ${ui.colors.lavender(scopesResult.data.length.toString())} synced${' '.repeat(56)} ║`);

    // Check if current scope is synced
    if (config.sync?.scopeId) {
      const currentScope = scopesResult.data.find((s) => s.id === config.sync?.scopeId);
      if (currentScope) {
        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        console.log(`║  ${ui.colors.text('Current scope:')}${' '.repeat(61)} ║`);
        console.log(`║    ${ui.icons.info} ID:       ${ui.colors.muted(currentScope.id.padEnd(61))} ║`);
        console.log(`║    ${ui.icons.watching} Active:   ${currentScope.isActive ? ui.colors.mint('Yes') : ui.colors.coral('No')}${' '.repeat(58)} ║`);
        if (currentScope.lastSyncedAt) {
          const lastSync = new Date(currentScope.lastSyncedAt).toLocaleString();
          console.log(`║    ${ui.icons.action} Synced:   ${ui.colors.muted(lastSync.padEnd(61))} ║`);
        }
      }
    }
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // Get stats if scope is synced
  if (config.sync?.scopeId && config.sync?.enabled) {
    const statsResult = await api.getLogStats(config.sync.scopeId, 'day');

    if (statsResult.success && statsResult.data) {
      ui.newLine();
      console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
      console.log(`║  ${ui.colors.amber('TODAY\'S STATS')}                                                              ║`);
      console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
      console.log(`║  ${ui.icons.info} Total:    ${ui.colors.text(statsResult.data.total.toString().padEnd(63))} ║`);
      console.log(`║  ${ui.icons.allowed} Allowed:  ${ui.colors.mint(statsResult.data.allowed.toString().padEnd(63))} ║`);
      console.log(`║  ${ui.icons.blocked} Blocked:  ${ui.colors.coral(statsResult.data.blocked.toString().padEnd(63))} ║`);
      console.log(`║  ${ui.icons.warning} Warnings: ${ui.colors.cream(statsResult.data.warnings.toString().padEnd(63))} ║`);
      console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    }
  }
}

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return '...' + str.slice(-(maxLength - 3));
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default statusCommand;
