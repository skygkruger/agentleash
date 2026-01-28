#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH CLI
// AI Agent Access Control
// ═══════════════════════════════════════════════════════════════

import { program } from 'commander';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import commands
import initCommand from './commands/init';
import watchCommand from './commands/watch';
import testCommand, { batchTestCommand } from './commands/test';
import statusCommand from './commands/status';
import {
  loginCommand,
  logoutCommand,
  whoamiCommand,
  createApiKeyCommand,
} from './commands/login';
import {
  listRulesCommand,
  allowCommand,
  denyCommand,
  removeRuleCommand,
  editRulesCommand,
} from './commands/rules';
import { logsCommand, statsCommand } from './commands/logs';
import { syncCommand, linkCommand, unlinkCommand } from './commands/sync';
import { validateCommand, formatCommand, doctorCommand } from './commands/validate';

// Import UI
import { printBanner, colors } from './utils/ui';

// ───────────────────────────────────────────────────────────────
// CLI PROGRAM
// ───────────────────────────────────────────────────────────────

program
  .name('leash')
  .description('AI Agent Access Control - Define path boundaries, monitor operations, get alerts')
  .version('1.0.0')
  .option('-c, --config <path>', 'Path to .agentleash.yml config file')
  .hook('preAction', () => {
    // Could add global pre-action hooks here
  });

// ───────────────────────────────────────────────────────────────
// INIT COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('init')
  .description('Create .agentleash.yml in current directory')
  .option('-p, --path <path>', 'Directory to initialize', '.')
  .option('--preset <name>', 'Use a preset (minimal, strict, nodejs, python)')
  .option('-f, --force', 'Overwrite existing config')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .action(initCommand);

// ───────────────────────────────────────────────────────────────
// WATCH COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('watch')
  .description('Start monitoring file operations')
  .option('-p, --path <path>', 'Directory to watch')
  .option('-c, --config <path>', 'Path to config file')
  .option('-q, --quiet', 'Only show blocked operations')
  .option('--sync', 'Sync events to cloud')
  .action(watchCommand);

// ───────────────────────────────────────────────────────────────
// TEST COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('test <path>')
  .description('Test if a path would be allowed/denied')
  .option('-o, --operation <type>', 'Operation to test (read,write,delete)')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Show matching rules')
  .action(testCommand);

program
  .command('test-batch')
  .description('Test multiple paths at once')
  .argument('<paths...>', 'Paths to test')
  .option('-o, --operation <type>', 'Operation to test', 'read')
  .option('-c, --config <path>', 'Path to config file')
  .action((paths, options) => batchTestCommand(paths, options));

// ───────────────────────────────────────────────────────────────
// STATUS COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('status')
  .description('Show current scope info and stats')
  .option('-c, --config <path>', 'Path to config file')
  .option('--cloud', 'Include cloud status')
  .action(statusCommand);

// ───────────────────────────────────────────────────────────────
// AUTH COMMANDS
// ───────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Authenticate with AgentLeash')
  .option('--api-key <key>', 'Use API key instead of interactive login')
  .option('--email <email>', 'Pre-fill email')
  .action(loginCommand);

program
  .command('logout')
  .description('Log out from AgentLeash')
  .option('--all', 'Clear all credentials including API key')
  .action(logoutCommand);

program
  .command('whoami')
  .description('Show current authenticated user')
  .action(whoamiCommand);

program
  .command('api-key')
  .description('Create a new API key')
  .option('-n, --name <name>', 'Name for the API key')
  .action(createApiKeyCommand);

// ───────────────────────────────────────────────────────────────
// RULES COMMANDS
// ───────────────────────────────────────────────────────────────

program
  .command('rules')
  .description('List configured rules')
  .option('-c, --config <path>', 'Path to config file')
  .option('--json', 'Output as JSON')
  .action(listRulesCommand);

program
  .command('allow <pattern>')
  .description('Add an allow rule')
  .option('-o, --operation <ops>', 'Operations to allow (comma-separated)', 'read,write')
  .option('-r, --reason <text>', 'Reason for the rule')
  .option('-c, --config <path>', 'Path to config file')
  .action(allowCommand);

program
  .command('deny <pattern>')
  .description('Add a deny rule')
  .option('-o, --operation <ops>', 'Operations to deny (comma-separated)', 'read,write,delete')
  .option('-r, --reason <text>', 'Reason for the rule')
  .option('-c, --config <path>', 'Path to config file')
  .action(denyCommand);

program
  .command('rule-remove <pattern>')
  .description('Remove a rule')
  .option('-c, --config <path>', 'Path to config file')
  .option('-y, --yes', 'Skip confirmation')
  .action(removeRuleCommand);

program
  .command('rules-edit')
  .description('Interactive rule editor')
  .option('-c, --config <path>', 'Path to config file')
  .action(editRulesCommand);

// ───────────────────────────────────────────────────────────────
// LOGS COMMANDS
// ───────────────────────────────────────────────────────────────

program
  .command('logs')
  .description('View access logs from cloud')
  .option('-l, --limit <number>', 'Number of logs to show', '50')
  .option('-o, --operation <type>', 'Filter by operation type')
  .option('-r, --result <type>', 'Filter by result (allowed, blocked, warning)')
  .option('-c, --config <path>', 'Path to config file')
  .option('--json', 'Output as JSON')
  .action(logsCommand);

program
  .command('stats')
  .description('View access statistics')
  .option('-p, --period <period>', 'Time period (hour, day, week, month)', 'day')
  .option('-c, --config <path>', 'Path to config file')
  .option('--json', 'Output as JSON')
  .action(statsCommand);

// ───────────────────────────────────────────────────────────────
// SYNC COMMANDS
// ───────────────────────────────────────────────────────────────

program
  .command('sync')
  .description('Sync configuration with cloud')
  .option('--push', 'Push local config to cloud')
  .option('--pull', 'Pull cloud config to local')
  .option('-c, --config <path>', 'Path to config file')
  .option('-f, --force', 'Skip confirmations')
  .action(syncCommand);

program
  .command('link <scopeId>')
  .description('Link local config to a cloud scope')
  .option('-c, --config <path>', 'Path to config file')
  .action(linkCommand);

program
  .command('unlink')
  .description('Unlink local config from cloud scope')
  .option('-c, --config <path>', 'Path to config file')
  .action(unlinkCommand);

// ───────────────────────────────────────────────────────────────
// VALIDATE COMMANDS
// ───────────────────────────────────────────────────────────────

program
  .command('validate')
  .description('Validate configuration file')
  .option('-c, --config <path>', 'Path to config file')
  .option('--json', 'Output as JSON')
  .option('--strict', 'Treat warnings as errors')
  .action(validateCommand);

program
  .command('format')
  .description('Format configuration file')
  .option('-c, --config <path>', 'Path to config file')
  .option('--check', 'Check formatting without modifying')
  .action(formatCommand);

program
  .command('doctor')
  .description('Check AgentLeash setup')
  .option('-c, --config <path>', 'Path to config file')
  .action(doctorCommand);

// ───────────────────────────────────────────────────────────────
// PARSE ARGS
// ───────────────────────────────────────────────────────────────

program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  printBanner();
  console.log('');
  console.log(colors.amber('AI agents are powerful. AgentLeash keeps them in line.'));
  console.log('');
  program.outputHelp();
  console.log('');
  console.log(colors.muted('Examples:'));
  console.log(`  ${colors.cyan('leash init')}              Create a new configuration`);
  console.log(`  ${colors.cyan('leash watch')}             Start monitoring file operations`);
  console.log(`  ${colors.cyan('leash test src/app.ts')}   Test if a path is allowed`);
  console.log(`  ${colors.cyan('leash allow "src/**"')}    Add an allow rule`);
  console.log(`  ${colors.cyan('leash deny ".env"')}       Add a deny rule`);
  console.log('');
  console.log(colors.muted('Documentation: https://agentleash.io/docs'));
  console.log('');
}
