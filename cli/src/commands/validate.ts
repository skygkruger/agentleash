// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT VALIDATE COMMAND
// Validate configuration file
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import YAML from 'yaml';
import ui from '../utils/ui';
import { findConfig, validateConfig, ScopeConfig } from '../utils/config';

// ───────────────────────────────────────────────────────────────
// VALIDATE COMMAND
// ───────────────────────────────────────────────────────────────

export interface ValidateOptions {
  config?: string;
  json?: boolean;
  strict?: boolean;
}

export async function validateCommand(options: ValidateOptions): Promise<void> {
  if (!options.json) {
    ui.printBanner();
  }

  // Find config
  const configPath = options.config || findConfig();

  if (!configPath) {
    if (options.json) {
      console.log(JSON.stringify({ valid: false, error: 'No .scopeagent.yml found' }));
    } else {
      ui.printError('No .scopeagent.yml found');
      ui.newLine();
      console.log(`Run ${ui.colors.cyan('scopeagent init')} to create a configuration file`);
    }
    process.exit(1);
  }

  // Read and parse config
  let rawConfig: unknown;
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    rawConfig = YAML.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read configuration';
    if (options.json) {
      console.log(JSON.stringify({ valid: false, error: message }));
    } else {
      ui.printError(message);
    }
    process.exit(1);
  }

  // Validate
  const result = validateConfig(rawConfig);

  // JSON output
  if (options.json) {
    console.log(JSON.stringify({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      path: configPath,
    }, null, 2));

    if (!result.valid || (options.strict && result.warnings.length > 0)) {
      process.exit(1);
    }
    return;
  }

  // Console output
  if (result.valid) {
    ui.printSuccess('Configuration is valid');
    ui.newLine();

    console.log(ui.box(
      `${ui.icons.info} Path:     ${ui.colors.muted(configPath)}\n` +
      `${ui.icons.config} Name:     ${ui.colors.amber((rawConfig as ScopeConfig).name)}\n` +
      `${ui.icons.action} Policy:   ${(rawConfig as ScopeConfig).defaultPolicy === 'deny' ? ui.colors.coral('DENY') : ui.colors.mint('ALLOW')}\n` +
      `${ui.icons.watching} Rules:    ${ui.colors.lavender((rawConfig as ScopeConfig).rules?.length?.toString() || '0')}`,
      'Configuration'
    ));

    // Show warnings
    if (result.warnings.length > 0) {
      ui.newLine();
      ui.printWarning(`${result.warnings.length} warning(s):`);
      for (const warning of result.warnings) {
        console.log(`  ${ui.colors.cream('•')} ${ui.colors.muted(warning)}`);
      }
    }

    // In strict mode, warnings are treated as errors
    if (options.strict && result.warnings.length > 0) {
      ui.newLine();
      ui.printError('Strict mode: warnings treated as errors');
      process.exit(1);
    }
  } else {
    ui.printError('Configuration is invalid');
    ui.newLine();

    console.log(`${ui.icons.info} ${ui.colors.text('Path:')} ${ui.colors.muted(configPath)}`);
    ui.newLine();

    // Show errors
    ui.printError(`${result.errors.length} error(s):`);
    for (const error of result.errors) {
      console.log(`  ${ui.colors.coral('•')} ${ui.colors.text(error)}`);
    }

    // Show warnings too
    if (result.warnings.length > 0) {
      ui.newLine();
      ui.printWarning(`${result.warnings.length} warning(s):`);
      for (const warning of result.warnings) {
        console.log(`  ${ui.colors.cream('•')} ${ui.colors.muted(warning)}`);
      }
    }

    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// FORMAT COMMAND
// ───────────────────────────────────────────────────────────────

export interface FormatOptions {
  config?: string;
  check?: boolean;
}

export async function formatCommand(options: FormatOptions): Promise<void> {
  ui.printBanner();

  const configPath = options.config || findConfig();

  if (!configPath) {
    ui.printError('No .scopeagent.yml found');
    process.exit(1);
  }

  // Read config
  let content: string;
  let parsed: unknown;
  try {
    content = fs.readFileSync(configPath, 'utf-8');
    parsed = YAML.parse(content);
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to read configuration');
    process.exit(1);
  }

  // Format
  const formatted = YAML.stringify(parsed, {
    indent: 2,
    lineWidth: 0,
  });

  const header = `# ═══════════════════════════════════════════════════════════════
# SCOPEAGENT CONFIGURATION
# AI Agent Permission Controller
# ═══════════════════════════════════════════════════════════════
#
# This file defines what paths AI agents can access in your project.
# Documentation: https://scopeagent.io/docs/configuration
#
# ───────────────────────────────────────────────────────────────

`;

  const formattedWithHeader = header + formatted;

  // Check mode - just compare
  if (options.check) {
    if (content === formattedWithHeader) {
      ui.printSuccess('Configuration is properly formatted');
    } else {
      ui.printError('Configuration needs formatting');
      ui.newLine();
      console.log(`Run ${ui.colors.cyan('scopeagent format')} to fix`);
      process.exit(1);
    }
    return;
  }

  // Write formatted config
  try {
    fs.writeFileSync(configPath, formattedWithHeader, 'utf-8');
    ui.printSuccess('Configuration formatted');
    ui.newLine();
    console.log(`${ui.icons.info} ${ui.colors.muted(configPath)}`);
  } catch (error) {
    ui.printError(error instanceof Error ? error.message : 'Failed to write configuration');
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// DOCTOR COMMAND
// ───────────────────────────────────────────────────────────────

export interface DoctorOptions {
  config?: string;
}

export async function doctorCommand(options: DoctorOptions): Promise<void> {
  ui.printBanner();

  const checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
  }> = [];

  // Check 1: Config file exists
  const configPath = options.config || findConfig();
  if (configPath) {
    checks.push({
      name: 'Configuration file',
      status: 'pass',
      message: `Found at ${configPath}`,
    });
  } else {
    checks.push({
      name: 'Configuration file',
      status: 'fail',
      message: 'No .scopeagent.yml found',
    });
  }

  // Check 2: Config is valid
  if (configPath) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = YAML.parse(content);
      const result = validateConfig(parsed);

      if (result.valid) {
        checks.push({
          name: 'Configuration valid',
          status: result.warnings.length > 0 ? 'warn' : 'pass',
          message: result.warnings.length > 0 ? `${result.warnings.length} warnings` : 'No errors',
        });
      } else {
        checks.push({
          name: 'Configuration valid',
          status: 'fail',
          message: `${result.errors.length} errors`,
        });
      }

      // Check 3: Has rules
      const ruleCount = (parsed as ScopeConfig).rules?.length || 0;
      if (ruleCount > 0) {
        checks.push({
          name: 'Rules configured',
          status: 'pass',
          message: `${ruleCount} rules defined`,
        });
      } else {
        checks.push({
          name: 'Rules configured',
          status: 'warn',
          message: 'No rules defined',
        });
      }

      // Check 4: Has sensitive file protection
      const hasSensitiveProtection = (parsed as ScopeConfig).rules?.some(
        (r) => r.pattern.includes('.env') || r.pattern.includes('secrets')
      );
      if (hasSensitiveProtection) {
        checks.push({
          name: 'Sensitive files protected',
          status: 'pass',
          message: 'Found .env or secrets rules',
        });
      } else {
        checks.push({
          name: 'Sensitive files protected',
          status: 'warn',
          message: 'Consider adding rules for .env files',
        });
      }
    } catch (error) {
      checks.push({
        name: 'Configuration valid',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Parse error',
      });
    }
  }

  // Check 5: Authentication
  const { isAuthenticated, getUser } = await import('../utils/auth');
  if (isAuthenticated()) {
    const user = getUser();
    checks.push({
      name: 'Authentication',
      status: 'pass',
      message: user ? `Logged in as ${user.email}` : 'Authenticated with API key',
    });
  } else {
    checks.push({
      name: 'Authentication',
      status: 'warn',
      message: 'Not logged in (cloud features unavailable)',
    });
  }

  // Display results
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('SCOPEAGENT DOCTOR')}                                                          ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  for (const check of checks) {
    const icon =
      check.status === 'pass'
        ? ui.icons.allowed
        : check.status === 'fail'
        ? ui.icons.blocked
        : ui.icons.warning;

    const statusColor =
      check.status === 'pass'
        ? ui.colors.mint
        : check.status === 'fail'
        ? ui.colors.coral
        : ui.colors.cream;

    console.log(`║  ${icon} ${ui.colors.text(check.name.padEnd(25))} ${statusColor(check.message.padEnd(43))} ║`);
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // Summary
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  ui.newLine();

  if (failCount > 0) {
    ui.printError(`${failCount} check(s) failed`);
    process.exit(1);
  } else if (warnCount > 0) {
    ui.printWarning(`All checks passed with ${warnCount} warning(s)`);
  } else {
    ui.printSuccess('All checks passed!');
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  validate: validateCommand,
  format: formatCommand,
  doctor: doctorCommand,
};
