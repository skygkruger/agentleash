#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT DAEMON
// File Watcher + Rule Evaluator + Real-time Monitoring
// ═══════════════════════════════════════════════════════════════

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import dotenv from 'dotenv';

import { ConfigParser, DEFAULT_CONFIG_TEMPLATE, ConfigError } from './config/parser';
import { ScopeWatcher, AccessEvent } from './watcher';
import { Violation } from './evaluator/engine';
import { Reporter } from './reporter';
import { VaultAgentIntegration } from './integrations';

dotenv.config();

// ───────────────────────────────────────────────────────────────
// ASCII BANNER
// ───────────────────────────────────────────────────────────────

const BANNER = `
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
// COLORS
// ───────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  amber: '\x1b[38;5;179m',
  mint: '\x1b[38;5;151m',
  coral: '\x1b[38;5;204m',
  muted: '\x1b[38;5;102m',
  bold: '\x1b[1m',
};

// ───────────────────────────────────────────────────────────────
// CLI PROGRAM
// ───────────────────────────────────────────────────────────────

program
  .name('scopeagent-daemon')
  .description('ScopeAgent file watcher daemon')
  .version('1.0.0');

// ───────────────────────────────────────────────────────────────
// START COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('start')
  .description('Start the daemon watching the current directory')
  .option('-c, --config <path>', 'Path to .scopeagent.yml', '.scopeagent.yml')
  .option('-a, --agent <name>', 'AI agent being monitored')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-colors', 'Disable colored output')
  .action(async (options) => {
    const configPath = path.resolve(options.config);
    const reporter = new Reporter({ colors: options.colors, verbose: options.verbose });

    // Check for config file
    if (!fs.existsSync(configPath)) {
      console.log(`${c.coral}[X] Configuration file not found: ${configPath}${c.reset}`);
      console.log(`${c.muted}    Run 'scopeagent init' to create one.${c.reset}`);
      process.exit(1);
    }

    // Parse config
    let parser: ConfigParser;
    try {
      parser = new ConfigParser(configPath);
      parser.parseConfig();
    } catch (error) {
      if (error instanceof ConfigError) {
        console.log(`${c.coral}[X] Configuration error: ${error.message}${c.reset}`);
      } else {
        console.log(`${c.coral}[X] Failed to load configuration${c.reset}`);
      }
      process.exit(1);
    }

    const config = parser.getConfig()!;
    const rules = parser.getRulesForAgent(options.agent);

    // Create watcher
    const watcher = new ScopeWatcher({
      basePath: config.base_path,
      rules,
      defaultPolicy: config.default_policy,
      agentIdentifier: options.agent,
    });

    // Display header
    console.clear();
    console.log(`${c.amber}${BANNER}${c.reset}`);
    console.log(reporter.formatWatchHeader(config.base_path, rules.length, config.name));

    // Handle access events
    watcher.on('access', (event: AccessEvent) => {
      console.log(reporter.formatLogLine(event));
    });

    // Handle violations
    watcher.on('violation', (violation: Violation) => {
      console.log(reporter.formatViolation(violation));
    });

    // Handle errors
    watcher.on('error', (error: Error) => {
      console.log(`${c.coral}[X] Watcher error: ${error.message}${c.reset}`);
    });

    // Watch for config changes
    parser.watchConfigChanges((_newConfig) => {
      console.log(`${c.amber}[*] Configuration reloaded${c.reset}`);
      const newRules = parser.getRulesForAgent(options.agent);
      watcher.updateRules(newRules);
    });

    // Start watching
    watcher.start();

    // Handle keyboard input
    if (process.stdin.isTTY) {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);

      process.stdin.on('keypress', (_str, key) => {
        if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
          console.log(`\n${c.amber}[*] Stopping daemon...${c.reset}`);
          watcher.stop().then(() => {
            parser.stopWatching();
            process.exit(0);
          });
        } else if (key.name === 's') {
          console.log(reporter.formatStats(watcher.getStats()));
        } else if (key.name === 'c') {
          console.clear();
          console.log(`${c.amber}${BANNER}${c.reset}`);
          console.log(reporter.formatWatchHeader(config.base_path, rules.length, config.name));
        } else if (key.name === 'r') {
          console.log(`\n${c.amber}[#] Active Rules (${rules.length})${c.reset}`);
          for (const rule of rules.slice(0, 10)) {
            const icon = rule.type === 'allow' ? `${c.mint}[/]${c.reset}` : `${c.coral}[X]${c.reset}`;
            console.log(`    ${icon} ${rule.path} - ${rule.reason || 'No reason'}`);
          }
          if (rules.length > 10) {
            console.log(`${c.muted}    ... and ${rules.length - 10} more${c.reset}`);
          }
          console.log('');
        } else if (key.name === 'h') {
          console.log(`
${c.amber}[?] Help${c.reset}
    q - Quit the daemon
    s - Show statistics
    c - Clear screen
    r - Show rules
    h - Show this help
`);
        }
      });
    }

    // Handle process signals
    process.on('SIGINT', async () => {
      console.log(`\n${c.amber}[*] Stopping daemon...${c.reset}`);
      await watcher.stop();
      parser.stopWatching();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await watcher.stop();
      parser.stopWatching();
      process.exit(0);
    });
  });

// ───────────────────────────────────────────────────────────────
// INIT COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('init')
  .description('Create .scopeagent.yml in the specified directory')
  .option('-p, --path <dir>', 'Directory to initialize', '.')
  .option('-f, --force', 'Overwrite existing config')
  .action((options) => {
    const dir = path.resolve(options.path);
    const configPath = path.join(dir, '.scopeagent.yml');

    // Check if config already exists
    if (fs.existsSync(configPath) && !options.force) {
      console.log(`${c.coral}[X] Configuration file already exists: ${configPath}${c.reset}`);
      console.log(`${c.muted}    Use --force to overwrite.${c.reset}`);
      process.exit(1);
    }

    // Create the config file
    try {
      // Get project name from directory
      const projectName = path.basename(dir).toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const configContent = DEFAULT_CONFIG_TEMPLATE.replace('my-project-scope', `${projectName}-scope`);

      fs.writeFileSync(configPath, configContent, 'utf-8');

      console.log(`${c.amber}${BANNER}${c.reset}`);
      console.log(`${c.mint}[/] Created .scopeagent.yml${c.reset}`);
      console.log(`${c.muted}    Path: ${configPath}${c.reset}`);
      console.log('');
      console.log(`${c.amber}Next steps:${c.reset}`);
      console.log(`${c.muted}1. Edit .scopeagent.yml to customize rules${c.reset}`);
      console.log(`${c.muted}2. Run 'scopeagent-daemon start' to begin watching${c.reset}`);
      console.log('');
    } catch (error) {
      console.log(`${c.coral}[X] Failed to create configuration: ${error}${c.reset}`);
      process.exit(1);
    }
  });

// ───────────────────────────────────────────────────────────────
// STATUS COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('status')
  .description('Show current configuration status')
  .option('-c, --config <path>', 'Path to .scopeagent.yml', '.scopeagent.yml')
  .option('--vault', 'Show combined status with VaultAgent')
  .action(async (options) => {
    const configPath = path.resolve(options.config);

    console.log(`${c.amber}${BANNER}${c.reset}`);

    if (!fs.existsSync(configPath)) {
      console.log(`${c.coral}[X] No configuration found${c.reset}`);
      console.log(`${c.muted}    Run 'scopeagent-daemon init' to create one.${c.reset}`);
      process.exit(1);
    }

    try {
      const parser = new ConfigParser(configPath);
      const config = parser.parseConfig();
      const rules = parser.getRulesForAgent();

      console.log(`${c.amber}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
      console.log(`${c.amber}║${c.reset}  ${c.bold}SCOPEAGENT STATUS${c.reset}${''.padEnd(58)}${c.amber}║${c.reset}`);
      console.log(`${c.amber}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);
      console.log(`${c.amber}║${c.reset}  Scope:          ${config.name.padEnd(57)} ${c.amber}║${c.reset}`);
      console.log(`${c.amber}║${c.reset}  Base Path:      ${config.base_path.slice(0, 57).padEnd(57)} ${c.amber}║${c.reset}`);
      console.log(`${c.amber}║${c.reset}  Default Policy: ${config.default_policy.padEnd(57)} ${c.amber}║${c.reset}`);
      console.log(`${c.amber}║${c.reset}  Rules:          ${String(rules.length).padEnd(57)} ${c.amber}║${c.reset}`);
      console.log(`${c.amber}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);
      console.log(`${c.amber}║${c.reset}  ${c.muted}Rules Summary:${c.reset}${''.padEnd(61)}${c.amber}║${c.reset}`);

      const allowRules = rules.filter((r) => r.type === 'allow').length;
      const denyRules = rules.filter((r) => r.type === 'deny').length;
      const mixedRules = rules.filter((r) => r.type === 'mixed').length;

      console.log(`${c.amber}║${c.reset}    ${c.mint}[/] Allow:${c.reset} ${String(allowRules).padEnd(5)} ${c.coral}[X] Deny:${c.reset} ${String(denyRules).padEnd(5)} ${c.muted}[~] Mixed:${c.reset} ${String(mixedRules).padEnd(20)} ${c.amber}║${c.reset}`);
      console.log(`${c.amber}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}`);

      // Show VaultAgent status if --vault flag is used
      if (options.vault) {
        console.log('');
        const vaultIntegration = new VaultAgentIntegration(config.base_path);
        const vaultStatus = await vaultIntegration.getStatus();

        console.log(`${c.amber}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
        console.log(`${c.amber}║${c.reset}  ${c.bold}VAULTAGENT STATUS${c.reset}${''.padEnd(58)}${c.amber}║${c.reset}`);
        console.log(`${c.amber}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);

        const installedIcon = vaultStatus.installed ? `${c.mint}[/]${c.reset}` : `${c.coral}[X]${c.reset}`;
        const configuredIcon = vaultStatus.configured ? `${c.mint}[/]${c.reset}` : `${c.coral}[X]${c.reset}`;
        const runningIcon = vaultStatus.running ? `${c.mint}[/]${c.reset}` : `${c.coral}[X]${c.reset}`;

        console.log(`${c.amber}║${c.reset}  Installed:      ${installedIcon} ${(vaultStatus.installed ? 'Yes' : 'No').padEnd(53)} ${c.amber}║${c.reset}`);
        console.log(`${c.amber}║${c.reset}  Configured:     ${configuredIcon} ${(vaultStatus.configured ? 'Yes' : 'No').padEnd(53)} ${c.amber}║${c.reset}`);
        console.log(`${c.amber}║${c.reset}  Running:        ${runningIcon} ${(vaultStatus.running ? 'Yes' : 'No').padEnd(53)} ${c.amber}║${c.reset}`);

        if (vaultStatus.version) {
          console.log(`${c.amber}║${c.reset}  Version:        ${vaultStatus.version.padEnd(57)} ${c.amber}║${c.reset}`);
        }

        console.log(`${c.amber}║${c.reset}  Protected:      ${String(vaultStatus.protectedPaths.length).padEnd(57)} ${c.amber}║${c.reset}`);

        if (vaultStatus.linkedSession) {
          console.log(`${c.amber}║${c.reset}  Linked Session: ${vaultStatus.linkedSession.slice(0, 57).padEnd(57)} ${c.amber}║${c.reset}`);
        }

        console.log(`${c.amber}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}`);

        // Show combined security stack status
        console.log('');
        console.log(`${c.amber}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
        console.log(`${c.amber}║${c.reset}  ${c.bold}AI AGENT SECURITY STACK${c.reset}${''.padEnd(52)}${c.amber}║${c.reset}`);
        console.log(`${c.amber}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);

        if (vaultStatus.installed && vaultStatus.configured) {
          console.log(`${c.amber}║${c.reset}  ${c.mint}[/] Complete security stack active${c.reset}${''.padEnd(40)}${c.amber}║${c.reset}`);
          console.log(`${c.amber}║${c.reset}      - VaultAgent: Protecting secrets FROM agents${''.padEnd(26)}${c.amber}║${c.reset}`);
          console.log(`${c.amber}║${c.reset}      - ScopeAgent: Protecting systems FROM agents${''.padEnd(26)}${c.amber}║${c.reset}`);
        } else if (!vaultStatus.installed) {
          console.log(`${c.amber}║${c.reset}  ${c.coral}[!] VaultAgent not installed${c.reset}${''.padEnd(47)}${c.amber}║${c.reset}`);
          console.log(`${c.amber}║${c.reset}      Install with: npm install -g @veridian/vaultagent${''.padEnd(22)}${c.amber}║${c.reset}`);
          console.log(`${c.amber}║${c.reset}      Complete your AI Agent Security Stack!${''.padEnd(32)}${c.amber}║${c.reset}`);
        } else {
          console.log(`${c.amber}║${c.reset}  ${c.coral}[!] VaultAgent not configured${c.reset}${''.padEnd(46)}${c.amber}║${c.reset}`);
          console.log(`${c.amber}║${c.reset}      Run: vaultagent init${''.padEnd(50)}${c.amber}║${c.reset}`);
        }

        console.log(`${c.amber}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}`);
      } else {
        // Show tip about VaultAgent
        const vaultIntegration = new VaultAgentIntegration(config.base_path);
        const vaultDetected = await vaultIntegration.detectVaultAgent();

        console.log('');
        if (!vaultDetected) {
          console.log(`${c.muted}Tip: Add VaultAgent for complete AI agent security.${c.reset}`);
          console.log(`${c.muted}     Run 'scopeagent-daemon status --vault' for combined status.${c.reset}`);
        }
      }

      console.log('');
    } catch (error) {
      if (error instanceof ConfigError) {
        console.log(`${c.coral}[X] Configuration error: ${error.message}${c.reset}`);
      } else {
        console.log(`${c.coral}[X] Failed to read configuration${c.reset}`);
      }
      process.exit(1);
    }
  });

// ───────────────────────────────────────────────────────────────
// TEST COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('test <path>')
  .description('Test if a path would be allowed')
  .option('-c, --config <configPath>', 'Path to .scopeagent.yml', '.scopeagent.yml')
  .option('-o, --operation <type>', 'Operation to test', 'read')
  .action((testPath, options) => {
    const configPath = path.resolve(options.config);

    if (!fs.existsSync(configPath)) {
      console.log(`${c.coral}[X] No configuration found${c.reset}`);
      process.exit(1);
    }

    try {
      const parser = new ConfigParser(configPath);
      parser.parseConfig();
      const rules = parser.getRulesForAgent();

      const watcher = new ScopeWatcher({
        basePath: parser.getBasePath(),
        rules,
        defaultPolicy: parser.getDefaultPolicy(),
      });

      const decision = watcher.testPath(testPath, options.operation);

      console.log('');
      console.log(`${c.amber}[?] Testing path: ${testPath}${c.reset}`);
      console.log(`${c.muted}    Operation: ${options.operation}${c.reset}`);
      console.log('');

      if (decision.allowed) {
        console.log(`${c.mint}[/] ALLOWED${c.reset}`);
      } else {
        console.log(`${c.coral}[X] BLOCKED${c.reset}`);
      }

      console.log(`${c.muted}    Reason: ${decision.reason}${c.reset}`);

      if (decision.matchedRule) {
        console.log(`${c.muted}    Matched: ${decision.matchedRule.path}${c.reset}`);
      }

      console.log('');
    } catch (error) {
      console.log(`${c.coral}[X] Error: ${error}${c.reset}`);
      process.exit(1);
    }
  });

// ───────────────────────────────────────────────────────────────
// VALIDATE COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('validate')
  .description('Validate the configuration file')
  .option('-c, --config <path>', 'Path to .scopeagent.yml', '.scopeagent.yml')
  .action((options) => {
    const configPath = path.resolve(options.config);

    if (!fs.existsSync(configPath)) {
      console.log(`${c.coral}[X] Configuration file not found: ${configPath}${c.reset}`);
      process.exit(1);
    }

    try {
      const parser = new ConfigParser(configPath);
      const config = parser.parseConfig();

      console.log(`${c.mint}[/] Configuration is valid${c.reset}`);
      console.log(`${c.muted}    Scope: ${config.name}${c.reset}`);
      console.log(`${c.muted}    Rules: ${config.rules.length}${c.reset}`);
    } catch (error) {
      if (error instanceof ConfigError) {
        console.log(`${c.coral}[X] Validation failed:${c.reset}`);
        console.log(`${c.coral}    ${error.message}${c.reset}`);
      } else {
        console.log(`${c.coral}[X] Error validating configuration${c.reset}`);
      }
      process.exit(1);
    }
  });

// ───────────────────────────────────────────────────────────────
// LINK-VAULT COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('link-vault')
  .description('Link VaultAgent account for combined security')
  .option('--api-key <key>', 'VaultAgent API key')
  .option('--unlink', 'Unlink VaultAgent account')
  .action(async (options) => {
    console.log(`${c.amber}${BANNER}${c.reset}`);

    const vaultIntegration = new VaultAgentIntegration();

    if (options.unlink) {
      vaultIntegration.unlinkAccount();
      console.log(`${c.mint}[/] VaultAgent account unlinked${c.reset}`);
      return;
    }

    if (options.apiKey) {
      console.log(`${c.muted}[~] Linking VaultAgent account...${c.reset}`);
      const result = await vaultIntegration.linkAccount(options.apiKey);

      if (result.success) {
        console.log(`${c.mint}[/] ${result.message}${c.reset}`);
        console.log('');
        console.log(`${c.amber}AI Agent Security Stack is now complete:${c.reset}`);
        console.log(`${c.muted}  - VaultAgent: Protecting secrets FROM agents${c.reset}`);
        console.log(`${c.muted}  - ScopeAgent: Protecting systems FROM agents${c.reset}`);
      } else {
        console.log(`${c.coral}[X] ${result.message}${c.reset}`);
      }
    } else {
      // Check current status
      const status = await vaultIntegration.getStatus();

      if (vaultIntegration.isAccountLinked()) {
        console.log(`${c.mint}[/] VaultAgent account is linked${c.reset}`);
        if (status.version) {
          console.log(`${c.muted}    Version: ${status.version}${c.reset}`);
        }
        console.log('');
        console.log(`${c.muted}To unlink: scopeagent-daemon link-vault --unlink${c.reset}`);
      } else {
        console.log(`${c.coral}[X] VaultAgent account not linked${c.reset}`);
        console.log('');
        console.log(`${c.amber}To link your VaultAgent account:${c.reset}`);
        console.log(`${c.muted}1. Get your VaultAgent API key from https://vaultagent.dev/settings${c.reset}`);
        console.log(`${c.muted}2. Run: scopeagent-daemon link-vault --api-key YOUR_API_KEY${c.reset}`);
        console.log('');
        console.log(`${c.amber}Why link?${c.reset}`);
        console.log(`${c.muted}- Combined security dashboard${c.reset}`);
        console.log(`${c.muted}- Unified audit logs${c.reset}`);
        console.log(`${c.muted}- Bundle pricing discounts${c.reset}`);
      }
    }
  });

// ───────────────────────────────────────────────────────────────
// VAULT-RULES COMMAND
// ───────────────────────────────────────────────────────────────

program
  .command('vault-rules')
  .description('Generate deny rules for VaultAgent protected paths')
  .option('--apply', 'Apply rules to current config')
  .action(async (options) => {
    console.log(`${c.amber}${BANNER}${c.reset}`);

    const vaultIntegration = new VaultAgentIntegration();
    const protectedPaths = await vaultIntegration.getProtectedPaths();

    console.log(`${c.amber}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.amber}║${c.reset}  ${c.bold}VAULTAGENT PROTECTED PATHS${c.reset}${''.padEnd(49)}${c.amber}║${c.reset}`);
    console.log(`${c.amber}╠══════════════════════════════════════════════════════════════════════════════╣${c.reset}`);

    for (const p of protectedPaths) {
      console.log(`${c.amber}║${c.reset}  ${c.coral}[X]${c.reset} ${p.padEnd(70)} ${c.amber}║${c.reset}`);
    }

    console.log(`${c.amber}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}`);
    console.log('');

    if (options.apply) {
      console.log(`${c.muted}[~] Applying rules to .scopeagent.yml...${c.reset}`);
      // TODO: Implement rule application
      console.log(`${c.coral}[!] Not yet implemented. Add these patterns manually to your config.${c.reset}`);
    } else {
      console.log(`${c.muted}Add these patterns to your .scopeagent.yml to protect secrets:${c.reset}`);
      console.log('');
      console.log(`${c.amber}rules:${c.reset}`);
      for (const p of protectedPaths.slice(0, 5)) {
        console.log(`${c.muted}  - path: "${p}"${c.reset}`);
        console.log(`${c.muted}    deny: [read, write, delete]${c.reset}`);
        console.log(`${c.muted}    reason: "VaultAgent protected path"${c.reset}`);
      }
      if (protectedPaths.length > 5) {
        console.log(`${c.muted}  # ... and ${protectedPaths.length - 5} more${c.reset}`);
      }
    }
  });

// ───────────────────────────────────────────────────────────────
// PARSE ARGS
// ───────────────────────────────────────────────────────────────

program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(`${c.amber}${BANNER}${c.reset}`);
  program.outputHelp();
}
