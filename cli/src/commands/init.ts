// ═══════════════════════════════════════════════════════════════
// AGENTLEASH INIT COMMAND
// Initialize .agentleash.yml in current directory
// ═══════════════════════════════════════════════════════════════

import * as path from 'path';
import inquirer from 'inquirer';
import ui from '../utils/ui';
import {
  configExists,
  getConfigPath,
  saveConfig,
  DEFAULT_CONFIG,
  ScopeConfig,
  Rule,
} from '../utils/config';

// ───────────────────────────────────────────────────────────────
// PRESET TEMPLATES
// ───────────────────────────────────────────────────────────────

const PRESETS: Record<string, Partial<ScopeConfig>> = {
  minimal: {
    rules: [
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
    ],
  },
  strict: {
    defaultPolicy: 'deny',
    rules: [
      {
        pattern: 'src/**/*',
        allow: ['read', 'write'],
        reason: 'Allow access to source code',
      },
      {
        pattern: 'tests/**/*',
        allow: ['read', 'write'],
        reason: 'Allow access to tests',
      },
      {
        pattern: 'package.json',
        allow: ['read', 'write'],
        reason: 'Allow package.json access',
      },
      {
        pattern: 'tsconfig.json',
        allow: ['read'],
        reason: 'Allow reading TypeScript config',
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
    ],
  },
  nodejs: {
    rules: [
      {
        pattern: 'src/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to source code',
      },
      {
        pattern: 'lib/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to lib directory',
      },
      {
        pattern: 'tests/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to tests',
      },
      {
        pattern: '__tests__/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to Jest tests',
      },
      {
        pattern: 'package.json',
        allow: ['read', 'write'],
        reason: 'Package configuration',
      },
      {
        pattern: 'package-lock.json',
        allow: ['read'],
        deny: ['write', 'delete'],
        reason: 'Read-only lockfile',
      },
      {
        pattern: 'node_modules/**',
        allow: ['read'],
        deny: ['write', 'delete'],
        reason: 'Read-only dependencies',
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
    ],
  },
  python: {
    rules: [
      {
        pattern: 'src/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to source code',
      },
      {
        pattern: 'app/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to app directory',
      },
      {
        pattern: 'tests/**/*',
        allow: ['read', 'write'],
        reason: 'Full access to tests',
      },
      {
        pattern: 'requirements.txt',
        allow: ['read', 'write'],
        reason: 'Dependencies file',
      },
      {
        pattern: 'pyproject.toml',
        allow: ['read', 'write'],
        reason: 'Project configuration',
      },
      {
        pattern: '.venv/**',
        allow: ['read'],
        deny: ['write', 'delete'],
        reason: 'Read-only virtual environment',
      },
      {
        pattern: '.env',
        deny: ['read', 'write', 'delete'],
        reason: 'Protect environment variables',
      },
      {
        pattern: '**/*.key',
        deny: ['read', 'write', 'delete'],
        reason: 'Protect private keys',
      },
      {
        pattern: '**/secrets/**',
        deny: ['read', 'write', 'delete', 'list'],
        reason: 'Protect secrets directory',
      },
    ],
  },
};

// ───────────────────────────────────────────────────────────────
// INIT COMMAND
// ───────────────────────────────────────────────────────────────

export interface InitOptions {
  path?: string;
  preset?: string;
  force?: boolean;
  yes?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  ui.printBanner();

  const directory = path.resolve(options.path || '.');
  const configPath = getConfigPath(directory);

  // Check if config already exists
  if (configExists(directory) && !options.force) {
    ui.printWarning(`.agentleash.yml already exists in ${directory}`);

    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing configuration?',
        default: false,
      },
    ]);

    if (!overwrite) {
      ui.printInfo('Initialization cancelled');
      return;
    }
  }

  let config: ScopeConfig;

  if (options.yes) {
    // Non-interactive mode - use defaults
    config = {
      ...DEFAULT_CONFIG,
      name: path.basename(directory),
      basePath: directory,
    };
  } else {
    // Interactive setup
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Scope name:',
        default: path.basename(directory),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):',
        default: '',
      },
      {
        type: 'list',
        name: 'preset',
        message: 'Choose a preset:',
        choices: [
          { name: 'Default - Balanced protection for most projects', value: 'default' },
          { name: 'Minimal - Basic sensitive file protection only', value: 'minimal' },
          { name: 'Strict  - Explicit allow rules required', value: 'strict' },
          { name: 'Node.js - Optimized for Node.js projects', value: 'nodejs' },
          { name: 'Python  - Optimized for Python projects', value: 'python' },
          { name: 'Custom  - Start with empty rules', value: 'custom' },
        ],
        default: options.preset || 'default',
      },
      {
        type: 'list',
        name: 'defaultPolicy',
        message: 'Default policy for paths without matching rules:',
        choices: [
          { name: 'Deny  - Block access by default (recommended)', value: 'deny' },
          { name: 'Allow - Allow access by default', value: 'allow' },
        ],
        default: 'deny',
      },
      {
        type: 'checkbox',
        name: 'agents',
        message: 'Which AI agents will you use?',
        choices: [
          { name: 'Claude Code', value: 'claude-code', checked: true },
          { name: 'Cursor', value: 'cursor', checked: true },
          { name: 'GitHub Copilot', value: 'copilot' },
          { name: 'Windsurf', value: 'windsurf' },
        ],
      },
      {
        type: 'confirm',
        name: 'enableSync',
        message: 'Enable cloud sync for dashboard access?',
        default: false,
      },
    ]);

    // Build config from answers
    const presetRules = answers.preset === 'default'
      ? DEFAULT_CONFIG.rules
      : answers.preset === 'custom'
      ? []
      : PRESETS[answers.preset]?.rules || DEFAULT_CONFIG.rules;

    config = {
      version: 1,
      name: answers.name,
      description: answers.description || undefined,
      basePath: directory,
      defaultPolicy: answers.defaultPolicy,
      rules: presetRules as Rule[],
      agents: answers.agents.length > 0 ? answers.agents : undefined,
      notifications: {
        onBlocked: true,
        onViolation: true,
      },
      sync: {
        enabled: answers.enableSync,
      },
    };
  }

  // Save config
  try {
    saveConfig(config, configPath);
    ui.newLine();
    ui.printSuccess(`Created ${ui.colors.amber('.agentleash.yml')}`);
    ui.newLine();

    // Show summary
    console.log(ui.box(
      `${ui.icons.config} ${ui.colors.text('Scope:')} ${ui.colors.amber(config.name)}\n` +
      `${ui.icons.action} ${ui.colors.text('Policy:')} ${config.defaultPolicy === 'deny' ? ui.colors.coral('DENY') : ui.colors.mint('ALLOW')}\n` +
      `${ui.icons.watching} ${ui.colors.text('Rules:')} ${ui.colors.lavender(config.rules.length.toString())} configured\n` +
      `${ui.icons.info} ${ui.colors.text('Path:')} ${ui.colors.muted(configPath)}`,
      'Configuration'
    ));

    ui.newLine();
    ui.printInfo('Next steps:');
    console.log(`  ${ui.colors.muted('1.')} Review and customize ${ui.colors.amber('.agentleash.yml')}`);
    console.log(`  ${ui.colors.muted('2.')} Run ${ui.colors.cyan('leash watch')} to start monitoring`);
    console.log(`  ${ui.colors.muted('3.')} Run ${ui.colors.cyan('leash test <path>')} to test rules`);
    ui.newLine();

  } catch (error) {
    ui.printError(
      error instanceof Error ? error.message : 'Failed to create configuration file'
    );
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default initCommand;
