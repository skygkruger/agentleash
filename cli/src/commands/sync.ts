// ═══════════════════════════════════════════════════════════════
// AGENTLEASH SYNC COMMAND
// Sync configuration with cloud
// ═══════════════════════════════════════════════════════════════

import inquirer from 'inquirer';
import ui from '../utils/ui';
import { findConfig, loadConfig, saveConfig, ScopeConfig } from '../utils/config';
import auth from '../utils/auth';
import api from '../utils/api';

// ───────────────────────────────────────────────────────────────
// SYNC COMMAND
// ───────────────────────────────────────────────────────────────

export interface SyncOptions {
  push?: boolean;
  pull?: boolean;
  config?: string;
  force?: boolean;
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  ui.printBanner();

  // Check authentication
  if (!auth.isAuthenticated()) {
    ui.printError('Authentication required');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('leash login')} first`);
    process.exit(1);
  }

  // Find and load config
  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .agentleash.yml found');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('leash init')} first`);
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

  // Determine sync direction
  if (!options.push && !options.pull) {
    const { direction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'direction',
        message: 'Sync direction:',
        choices: [
          { name: 'Push - Upload local config to cloud', value: 'push' },
          { name: 'Pull - Download cloud config to local', value: 'pull' },
        ],
      },
    ]);

    if (direction === 'push') {
      options.push = true;
    } else {
      options.pull = true;
    }
  }

  if (options.push) {
    await pushConfig(config, configPath, options.force);
  } else if (options.pull) {
    await pullConfig(config, configPath, options.force);
  }
}

// ───────────────────────────────────────────────────────────────
// PUSH CONFIG
// ───────────────────────────────────────────────────────────────

async function pushConfig(
  config: ScopeConfig,
  configPath: string,
  _force?: boolean
): Promise<void> {
  const spinner = ui.spinner('Pushing configuration to cloud...');
  spinner.start();

  let scopeId = config.sync?.scopeId;

  // Create scope if not exists
  if (!scopeId) {
    spinner.text = 'Creating new scope...';

    const createResult = await api.createScope({
      name: config.name,
      description: config.description,
      basePath: config.basePath || process.cwd(),
      defaultPolicy: config.defaultPolicy,
    });

    if (!createResult.success || !createResult.data) {
      spinner.fail(ui.colors.coral('Failed to create scope'));
      ui.printError(createResult.error || 'Unknown error');
      process.exit(1);
    }

    scopeId = createResult.data.id;

    // Update local config with scope ID
    config = {
      ...config,
      sync: {
        ...config.sync,
        enabled: true,
        scopeId,
      },
    };

    try {
      saveConfig(config, configPath);
    } catch (error) {
      spinner.warn(ui.colors.cream('Scope created but failed to save local config'));
    }
  }

  // Convert rules to API format
  const rules = config.rules.map((rule, index) => ({
    pathPattern: rule.pattern,
    ruleType: (rule.allow && rule.allow.length > 0 ? 'allow' : 'deny') as 'allow' | 'deny',
    operations: rule.allow || rule.deny || [],
    priority: index,
    reason: rule.reason,
  }));

  // Sync rules
  spinner.text = 'Syncing rules...';

  const syncResult = await api.syncScope(scopeId, rules as any);

  if (!syncResult.success) {
    spinner.fail(ui.colors.coral('Failed to sync rules'));
    ui.printError(syncResult.error || 'Unknown error');
    process.exit(1);
  }

  spinner.succeed(ui.colors.mint('Configuration pushed to cloud'));

  ui.newLine();
  console.log(ui.box(
    `${ui.icons.info} Scope ID: ${ui.colors.muted(scopeId)}\n` +
    `${ui.icons.config} Rules:    ${ui.colors.lavender(rules.length.toString())} synced\n` +
    `${ui.icons.action} Policy:   ${config.defaultPolicy === 'deny' ? ui.colors.coral('DENY') : ui.colors.mint('ALLOW')}`,
    'Sync Complete'
  ));

  ui.newLine();
  ui.printInfo(`View in dashboard: ${ui.colors.cyan('https://agentleash.io/dashboard')}`);
}

// ───────────────────────────────────────────────────────────────
// PULL CONFIG
// ───────────────────────────────────────────────────────────────

async function pullConfig(
  config: ScopeConfig,
  configPath: string,
  force?: boolean
): Promise<void> {
  const spinner = ui.spinner('Fetching configuration from cloud...');
  spinner.start();

  let scopeId = config.sync?.scopeId;

  // If no scope ID, let user select
  if (!scopeId) {
    spinner.text = 'Fetching available scopes...';

    const scopesResult = await api.listScopes();

    if (!scopesResult.success || !scopesResult.data || scopesResult.data.length === 0) {
      spinner.fail(ui.colors.coral('No scopes found'));
      ui.printInfo('Push your local config first with: leash sync --push');
      process.exit(1);
    }

    spinner.stop();

    const { selectedScope } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedScope',
        message: 'Select scope to pull:',
        choices: scopesResult.data.map((s) => ({
          name: `${s.name} (${s.basePath})`,
          value: s.id,
        })),
      },
    ]);

    scopeId = selectedScope;
    spinner.start();
  }

  // Export scope
  spinner.text = 'Downloading configuration...';

  const exportResult = await api.exportScope(scopeId as string);

  if (!exportResult.success || !exportResult.data) {
    spinner.fail(ui.colors.coral('Failed to export scope'));
    ui.printError(exportResult.error || 'Unknown error');
    process.exit(1);
  }

  // Get rules
  const rulesResult = await api.listRules(scopeId as string);

  if (!rulesResult.success) {
    spinner.fail(ui.colors.coral('Failed to fetch rules'));
    ui.printError(rulesResult.error || 'Unknown error');
    process.exit(1);
  }

  spinner.stop();

  // Show changes
  const cloudRules = rulesResult.data || [];
  const localRuleCount = config.rules.length;
  const cloudRuleCount = cloudRules.length;

  if (!force && localRuleCount > 0 && cloudRuleCount !== localRuleCount) {
    ui.printWarning(`Local config has ${localRuleCount} rules, cloud has ${cloudRuleCount}`);
    ui.newLine();

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Overwrite local configuration?',
        default: false,
      },
    ]);

    if (!confirm) {
      ui.printInfo('Sync cancelled');
      return;
    }
  }

  // Convert cloud rules to local format
  const newRules = cloudRules.map((r) => ({
    pattern: r.pathPattern,
    [r.ruleType]: r.operations,
    reason: r.reason,
  }));

  // Update local config
  const newConfig: ScopeConfig = {
    ...config,
    rules: newRules as any,
    sync: {
      ...config.sync,
      enabled: true,
      scopeId,
    },
  };

  try {
    saveConfig(newConfig, configPath);
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to save configuration');
    process.exit(1);
  }

  ui.printSuccess('Configuration pulled from cloud');

  ui.newLine();
  console.log(ui.box(
    `${ui.icons.info} Scope ID: ${ui.colors.muted(scopeId)}\n` +
    `${ui.icons.config} Rules:    ${ui.colors.lavender(cloudRuleCount.toString())} downloaded\n` +
    `${ui.icons.action} File:     ${ui.colors.muted(configPath)}`,
    'Sync Complete'
  ));
}

// ───────────────────────────────────────────────────────────────
// LINK COMMAND
// ───────────────────────────────────────────────────────────────

export interface LinkOptions {
  config?: string;
}

export async function linkCommand(scopeId: string, options: LinkOptions): Promise<void> {
  ui.printBanner();

  if (!auth.isAuthenticated()) {
    ui.printError('Authentication required');
    process.exit(1);
  }

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .agentleash.yml found');
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

  // Verify scope exists
  const spinner = ui.spinner('Verifying scope...');
  spinner.start();

  const scopeResult = await api.getScope(scopeId);

  if (!scopeResult.success || !scopeResult.data) {
    spinner.fail(ui.colors.coral('Scope not found'));
    ui.printError(scopeResult.error || 'Invalid scope ID');
    process.exit(1);
  }

  // Update config
  config = {
    ...config,
    sync: {
      ...config.sync,
      enabled: true,
      scopeId,
    },
  };

  try {
    saveConfig(config, configPath);
    spinner.succeed(ui.colors.mint('Scope linked'));

    ui.newLine();
    console.log(ui.box(
      `${ui.icons.info} Scope:    ${ui.colors.amber(scopeResult.data.name)}\n` +
      `${ui.icons.config} ID:       ${ui.colors.muted(scopeId)}\n` +
      `${ui.icons.action} Status:   ${scopeResult.data.isActive ? ui.colors.mint('Active') : ui.colors.coral('Inactive')}`,
      'Linked'
    ));

    ui.newLine();
    ui.printInfo(`Run ${ui.colors.cyan('leash sync --pull')} to download cloud rules`);
    ui.printInfo(`Run ${ui.colors.cyan('leash sync --push')} to upload local rules`);
  } catch (error) {
    spinner.fail(ui.colors.coral('Failed to save configuration'));
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// UNLINK COMMAND
// ───────────────────────────────────────────────────────────────

export async function unlinkCommand(options: LinkOptions): Promise<void> {
  ui.printBanner();

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .agentleash.yml found');
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

  if (!config.sync?.scopeId) {
    ui.printInfo('No scope is currently linked');
    return;
  }

  const scopeId = config.sync.scopeId;

  // Update config
  config = {
    ...config,
    sync: {
      ...config.sync,
      enabled: false,
      scopeId: undefined,
    },
  };

  try {
    saveConfig(config, configPath);
    ui.printSuccess(`Unlinked from scope ${ui.colors.muted(scopeId)}`);
    ui.newLine();
    ui.printInfo('Local configuration preserved. Cloud sync disabled.');
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to save configuration');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  sync: syncCommand,
  link: linkCommand,
  unlink: unlinkCommand,
};
