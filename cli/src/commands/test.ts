// ═══════════════════════════════════════════════════════════════
// AGENTLEASH TEST COMMAND
// Test if a path would be allowed/denied
// ═══════════════════════════════════════════════════════════════

import { minimatch } from 'minimatch';
import ui from '../utils/ui';
import { findConfig, loadConfig, ScopeConfig, Rule } from '../utils/config';

// ───────────────────────────────────────────────────────────────
// TEST COMMAND
// ───────────────────────────────────────────────────────────────

export interface TestOptions {
  operation?: string;
  config?: string;
  verbose?: boolean;
}

export async function testCommand(
  testPath: string,
  options: TestOptions
): Promise<void> {
  ui.printBanner();

  // Find and load config
  const configPath = options.config || findConfig();

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

  const operations = options.operation
    ? options.operation.split(',').map((o) => o.trim())
    : ['read', 'write', 'delete'];

  // Normalize path
  const normalizedPath = testPath.replace(/\\/g, '/');

  ui.printInfo(`Testing path: ${ui.colors.amber(normalizedPath)}`);
  ui.newLine();

  // Test each operation
  const results: Array<{
    operation: string;
    result: 'allowed' | 'blocked';
    rule?: Rule;
  }> = [];

  for (const operation of operations) {
    const result = evaluateAccess(normalizedPath, operation, config);
    results.push({
      operation,
      result: result.result,
      rule: result.rule,
    });
  }

  // Display results
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  ${ui.colors.amber('TEST RESULTS')}                                                               ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  for (const r of results) {
    const icon = r.result === 'allowed' ? ui.icons.allowed : ui.icons.blocked;
    const resultText = r.result === 'allowed' ? ui.colors.mint('ALLOWED') : ui.colors.coral('BLOCKED');
    const opText = ui.colors.lavender(r.operation.toUpperCase().padEnd(8));

    console.log(`║  ${icon} ${opText} ${resultText}${' '.repeat(52)} ║`);

    if (r.rule && options.verbose) {
      const pattern = ui.colors.muted(`Pattern: ${r.rule.pattern}`);
      console.log(`║     ${pattern.padEnd(75)} ║`);
      if (r.rule.reason) {
        const reason = ui.colors.muted(`Reason: ${r.rule.reason}`);
        console.log(`║     ${reason.padEnd(75)} ║`);
      }
    }
  }

  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

  // Summary
  const _allowed = results.filter((r) => r.result === 'allowed').length;
  const blocked = results.filter((r) => r.result === 'blocked').length;

  const summaryIcon = blocked === 0 ? ui.icons.allowed : ui.icons.blocked;
  const summaryText = blocked === 0 ? ui.colors.mint('All operations allowed') : ui.colors.coral(`${blocked} operation(s) blocked`);

  console.log(`║  ${summaryIcon} ${summaryText}${' '.repeat(56 - summaryText.length + 20)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // Show matching rules in verbose mode
  if (options.verbose) {
    ui.newLine();
    ui.printInfo('Matching rules:');
    ui.newLine();

    const matchingRules = findMatchingRules(normalizedPath, config);
    if (matchingRules.length === 0) {
      console.log(`  ${ui.colors.muted('No matching rules - default policy applies')}`);
      console.log(`  ${ui.colors.muted(`Default policy: ${config.defaultPolicy.toUpperCase()}`)}`);
    } else {
      for (const rule of matchingRules) {
        console.log(ui.formatRule(
          rule.allow ? 'allow' : 'deny',
          rule.pattern,
          rule.allow || rule.deny || [],
          rule.reason
        ));
      }
    }
  }

  // Exit with error code if any operations are blocked
  if (blocked > 0) {
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// BATCH TEST COMMAND
// ───────────────────────────────────────────────────────────────

export interface BatchTestOptions {
  operation?: string;
  config?: string;
}

export async function batchTestCommand(
  paths: string[],
  options: BatchTestOptions
): Promise<void> {
  ui.printBanner();

  // Find and load config
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

  const operation = options.operation || 'read';

  ui.printInfo(`Testing ${paths.length} paths for ${ui.colors.lavender(operation.toUpperCase())} operation`);
  ui.newLine();

  const results: Array<{
    path: string;
    result: 'allowed' | 'blocked';
  }> = [];

  for (const testPath of paths) {
    const normalizedPath = testPath.replace(/\\/g, '/');
    const result = evaluateAccess(normalizedPath, operation, config);
    results.push({
      path: normalizedPath,
      result: result.result,
    });

    const icon = result.result === 'allowed' ? ui.icons.allowed : ui.icons.blocked;
    const resultText = result.result === 'allowed' ? ui.colors.mint('OK') : ui.colors.coral('BLOCKED');
    console.log(`${icon} ${resultText.padEnd(10)} ${ui.colors.text(normalizedPath)}`);
  }

  // Summary
  ui.newLine();
  const allowed = results.filter((r) => r.result === 'allowed').length;
  const blocked = results.filter((r) => r.result === 'blocked').length;

  console.log(ui.box(
    `${ui.colors.mint('Allowed:')} ${allowed}\n` +
    `${ui.colors.coral('Blocked:')} ${blocked}\n` +
    `${ui.colors.text('Total:')}   ${results.length}`,
    'Summary'
  ));

  if (blocked > 0) {
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

interface EvaluationResult {
  result: 'allowed' | 'blocked';
  rule?: Rule;
}

function evaluateAccess(
  filePath: string,
  operation: string,
  config: ScopeConfig
): EvaluationResult {
  // Check each rule in order
  for (const rule of config.rules) {
    const matches = minimatch(filePath, rule.pattern, {
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

function findMatchingRules(filePath: string, config: ScopeConfig): Rule[] {
  return config.rules.filter((rule) =>
    minimatch(filePath, rule.pattern, {
      dot: true,
      matchBase: true,
    })
  );
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default testCommand;
