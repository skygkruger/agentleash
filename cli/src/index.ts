#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT CLI
// AI Agent Permission Controller
// ═══════════════════════════════════════════════════════════════

import { program } from 'commander';
import dotenv from 'dotenv';

dotenv.config();

// ───────────────────────────────────────────────────────────────
// ASCII BANNER
// ───────────────────────────────────────────────────────────────

const banner = `
███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘
`;

// ───────────────────────────────────────────────────────────────
// CLI PROGRAM
// ───────────────────────────────────────────────────────────────

program
  .name('scopeagent')
  .description('AI Agent Permission Controller - Define path boundaries, monitor operations, get alerts')
  .version('1.0.0');

// ───────────────────────────────────────────────────────────────
// INIT COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('init')
  .description('Create .scopeagent.yml in current directory')
  .option('-p, --path <path>', 'Directory to initialize', '.')
  .action((options) => {
    console.log(banner);
    console.log('');
    console.log('Initializing ScopeAgent...');
    console.log(`Path: ${options.path}`);
    console.log('');
    console.log('[!] Init command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// WATCH COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('watch')
  .description('Start monitoring file operations')
  .option('-p, --path <path>', 'Directory to watch', '.')
  .action((options) => {
    console.log(banner);
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║  SCOPEAGENT                                          [WATCHING...]   ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Path: ${options.path.padEnd(60)} ║`);
    console.log('║  Status: [~] PENDING                                                 ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                      ║');
    console.log('║  [!] Watch command implementation coming in Phase 4                  ║');
    console.log('║                                                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
  });

// ───────────────────────────────────────────────────────────────
// STATUS COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('status')
  .description('Show current scope info and stats')
  .action(() => {
    console.log(banner);
    console.log('');
    console.log('[!] Status command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// LOGS COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('logs')
  .description('View recent access logs')
  .option('-l, --limit <number>', 'Number of logs to show', '50')
  .option('-o, --operation <type>', 'Filter by operation type')
  .option('-r, --result <type>', 'Filter by result type')
  .action((options) => {
    console.log(`Showing last ${options.limit} logs...`);
    console.log('');
    console.log('[!] Logs command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// ALLOW COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('allow <pattern>')
  .description('Quick add an allow rule')
  .option('-o, --operation <type>', 'Operation to allow', 'read,write')
  .action((pattern, options) => {
    console.log(`Adding allow rule: ${pattern}`);
    console.log(`Operations: ${options.operation}`);
    console.log('');
    console.log('[!] Allow command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// DENY COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('deny <pattern>')
  .description('Quick add a deny rule')
  .option('-o, --operation <type>', 'Operation to deny', 'read,write,delete')
  .action((pattern, options) => {
    console.log(`Adding deny rule: ${pattern}`);
    console.log(`Operations: ${options.operation}`);
    console.log('');
    console.log('[!] Deny command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// TEST COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('test <path>')
  .description('Test if a path would be allowed')
  .option('-o, --operation <type>', 'Operation to test', 'read')
  .action((path, options) => {
    console.log(`Testing path: ${path}`);
    console.log(`Operation: ${options.operation}`);
    console.log('');
    console.log('[!] Test command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// SYNC COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('sync')
  .description('Sync config to/from cloud')
  .option('--push', 'Push local config to cloud')
  .option('--pull', 'Pull cloud config to local')
  .action((options) => {
    if (options.push) {
      console.log('Pushing config to cloud...');
    } else if (options.pull) {
      console.log('Pulling config from cloud...');
    } else {
      console.log('Use --push or --pull to specify sync direction');
    }
    console.log('');
    console.log('[!] Sync command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// LOGIN COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('login')
  .description('Authenticate with ScopeAgent')
  .option('--api-key <key>', 'Use API key instead of interactive login')
  .action((options) => {
    if (options.apiKey) {
      console.log('Authenticating with API key...');
    } else {
      console.log('Starting interactive login...');
    }
    console.log('');
    console.log('[!] Login command implementation coming in Phase 4');
  });

// ───────────────────────────────────────────────────────────────
// PARSE ARGS
// ───────────────────────────────────────────────────────────────

program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  console.log('');
  program.outputHelp();
}
