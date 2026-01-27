// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT RULES COMMAND
// Manage allow/deny rules
// ═══════════════════════════════════════════════════════════════

import * as path from 'path';
import inquirer from 'inquirer';
import ui from '../utils/ui';
import {
  findConfig,
  loadConfig,
  saveConfig,
  getConfigPath,
  addRule,
  removeRule,
  ScopeConfig,
  Rule,
} from '../utils/config';

// ───────────────────────────────────────────────────────────────
// LIST RULES COMMAND
// ───────────────────────────────────────────────────────────────

export interface ListRulesOptions {
  config?: string;
  json?: boolean;
}

export async function listRulesCommand(options: ListRulesOptions): Promise<void> {
  if (!options.json) {
    ui.printBanner();
  }

  // Find and load config
  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .scopeagent.yml found');
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

  // JSON output
  if (options.json) {
    console.log(JSON.stringify(config.rules, null, 2));
    return;
  }

  // Print rules
  if (config.rules.length === 0) {
    ui.printInfo('No rules configured');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent allow <pattern>')} or ${ui.colors.cyan('scopeagent deny <pattern>')} to add rules`);
    return;
  }

  ui.printInfo(`${config.rules.length} rule(s) configured:`);
  ui.newLine();

  for (let i = 0; i < config.rules.length; i++) {
    const rule = config.rules[i];
    const index = ui.colors.muted(`${(i + 1).toString().padStart(2)}.`);
    const type = rule.allow && rule.allow.length > 0 ? 'allow' : 'deny';
    const operations = rule.allow || rule.deny || [];

    console.log(`${index} ${ui.formatRule(type as 'allow' | 'deny', rule.pattern, operations, rule.reason)}`);
    ui.newLine();
  }

  // Show default policy
  ui.newLine();
  console.log(`${ui.icons.config} Default policy: ${config.defaultPolicy === 'deny' ? ui.colors.coral('DENY') : ui.colors.mint('ALLOW')}`);
}

// ───────────────────────────────────────────────────────────────
// ALLOW COMMAND
// ───────────────────────────────────────────────────────────────

export interface AllowOptions {
  operation?: string;
  reason?: string;
  config?: string;
}

export async function allowCommand(
  pattern: string,
  options: AllowOptions
): Promise<void> {
  ui.printBanner();

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .scopeagent.yml found');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent init')} first`);
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

  const operations = options.operation
    ? options.operation.split(',').map((o) => o.trim() as any)
    : ['read', 'write'];

  const newRule: Rule = {
    pattern,
    allow: operations,
    reason: options.reason,
  };

  // Check if pattern already exists
  const existingIndex = config.rules.findIndex((r) => r.pattern === pattern);
  if (existingIndex !== -1) {
    const { update } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'update',
        message: `Rule for "${pattern}" already exists. Update it?`,
        default: true,
      },
    ]);

    if (!update) {
      ui.printInfo('No changes made');
      return;
    }

    config.rules[existingIndex] = newRule;
  } else {
    config = addRule(config, newRule);
  }

  try {
    saveConfig(config, configPath);
    ui.printSuccess(`Added allow rule for ${ui.colors.amber(pattern)}`);
    ui.newLine();
    console.log(ui.formatRule('allow', pattern, operations, options.reason));
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to save configuration');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// DENY COMMAND
// ───────────────────────────────────────────────────────────────

export interface DenyOptions {
  operation?: string;
  reason?: string;
  config?: string;
}

export async function denyCommand(
  pattern: string,
  options: DenyOptions
): Promise<void> {
  ui.printBanner();

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .scopeagent.yml found');
    ui.newLine();
    console.log(`Run ${ui.colors.cyan('scopeagent init')} first`);
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

  const operations = options.operation
    ? options.operation.split(',').map((o) => o.trim() as any)
    : ['read', 'write', 'delete'];

  const newRule: Rule = {
    pattern,
    deny: operations,
    reason: options.reason,
  };

  // Check if pattern already exists
  const existingIndex = config.rules.findIndex((r) => r.pattern === pattern);
  if (existingIndex !== -1) {
    const { update } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'update',
        message: `Rule for "${pattern}" already exists. Update it?`,
        default: true,
      },
    ]);

    if (!update) {
      ui.printInfo('No changes made');
      return;
    }

    config.rules[existingIndex] = newRule;
  } else {
    config = addRule(config, newRule);
  }

  try {
    saveConfig(config, configPath);
    ui.printSuccess(`Added deny rule for ${ui.colors.amber(pattern)}`);
    ui.newLine();
    console.log(ui.formatRule('deny', pattern, operations, options.reason));
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to save configuration');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// REMOVE RULE COMMAND
// ───────────────────────────────────────────────────────────────

export interface RemoveRuleOptions {
  config?: string;
  yes?: boolean;
}

export async function removeRuleCommand(
  pattern: string,
  options: RemoveRuleOptions
): Promise<void> {
  ui.printBanner();

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .scopeagent.yml found');
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

  // Find the rule
  const rule = config.rules.find((r) => r.pattern === pattern);
  if (!rule) {
    ui.printWarning(`No rule found for pattern: ${pattern}`);
    return;
  }

  // Confirm removal
  if (!options.yes) {
    const type = rule.allow && rule.allow.length > 0 ? 'allow' : 'deny';
    const operations = rule.allow || rule.deny || [];
    console.log(ui.formatRule(type as 'allow' | 'deny', rule.pattern, operations, rule.reason));
    ui.newLine();

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Remove this rule?',
        default: false,
      },
    ]);

    if (!confirm) {
      ui.printInfo('No changes made');
      return;
    }
  }

  config = removeRule(config, pattern);

  try {
    saveConfig(config, configPath);
    ui.printSuccess(`Removed rule for ${ui.colors.amber(pattern)}`);
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to save configuration');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// INTERACTIVE RULE EDITOR
// ───────────────────────────────────────────────────────────────

export interface EditRulesOptions {
  config?: string;
}

export async function editRulesCommand(options: EditRulesOptions): Promise<void> {
  ui.printBanner();

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .scopeagent.yml found');
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

  while (true) {
    ui.printInfo(`${config.rules.length} rule(s) configured`);
    ui.newLine();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'List rules', value: 'list' },
          { name: 'Add allow rule', value: 'allow' },
          { name: 'Add deny rule', value: 'deny' },
          { name: 'Remove rule', value: 'remove' },
          { name: 'Change default policy', value: 'policy' },
          new inquirer.Separator(),
          { name: 'Save and exit', value: 'save' },
          { name: 'Exit without saving', value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') {
      return;
    }

    if (action === 'save') {
      try {
        saveConfig(config, configPath);
        ui.printSuccess('Configuration saved');
      } catch (error) {
        ui.printError(error instanceof Error ? error.message : 'Failed to save');
      }
      return;
    }

    if (action === 'list') {
      for (const rule of config.rules) {
        const type = rule.allow && rule.allow.length > 0 ? 'allow' : 'deny';
        const operations = rule.allow || rule.deny || [];
        console.log(ui.formatRule(type as 'allow' | 'deny', rule.pattern, operations, rule.reason));
      }
      ui.newLine();
      continue;
    }

    if (action === 'allow' || action === 'deny') {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'pattern',
          message: 'Glob pattern:',
          validate: (input) => (input.length > 0 ? true : 'Pattern is required'),
        },
        {
          type: 'checkbox',
          name: 'operations',
          message: 'Operations:',
          choices: [
            { name: 'read', checked: true },
            { name: 'write', checked: action === 'allow' },
            { name: 'delete', checked: action === 'deny' },
            { name: 'execute', checked: false },
            { name: 'list', checked: false },
          ],
        },
        {
          type: 'input',
          name: 'reason',
          message: 'Reason (optional):',
        },
      ]);

      const newRule: Rule = {
        pattern: answers.pattern,
        [action]: answers.operations,
        reason: answers.reason || undefined,
      };

      config = addRule(config, newRule);
      ui.printSuccess(`Added ${action} rule`);
      continue;
    }

    if (action === 'remove') {
      if (config.rules.length === 0) {
        ui.printWarning('No rules to remove');
        continue;
      }

      const { pattern } = await inquirer.prompt([
        {
          type: 'list',
          name: 'pattern',
          message: 'Select rule to remove:',
          choices: config.rules.map((r) => ({
            name: `${r.pattern} (${r.allow ? 'allow' : 'deny'})`,
            value: r.pattern,
          })),
        },
      ]);

      config = removeRule(config, pattern);
      ui.printSuccess('Rule removed');
      continue;
    }

    if (action === 'policy') {
      const { policy } = await inquirer.prompt([
        {
          type: 'list',
          name: 'policy',
          message: 'Default policy:',
          choices: [
            { name: 'Deny - Block access by default', value: 'deny' },
            { name: 'Allow - Allow access by default', value: 'allow' },
          ],
          default: config.defaultPolicy,
        },
      ]);

      config.defaultPolicy = policy;
      ui.printSuccess(`Default policy set to ${policy.toUpperCase()}`);
    }
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  list: listRulesCommand,
  allow: allowCommand,
  deny: denyCommand,
  remove: removeRuleCommand,
  edit: editRulesCommand,
};
