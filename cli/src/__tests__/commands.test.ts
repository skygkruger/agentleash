// ═══════════════════════════════════════════════════════════════
// CLI COMMANDS TESTS
// Tests for CLI command parsing and execution
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from '@jest/globals';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

interface ParsedCommand {
  command: string;
  args: string[];
  options: Record<string, string | boolean>;
}

// ───────────────────────────────────────────────────────────────
// PARSER FUNCTIONS
// ───────────────────────────────────────────────────────────────

const parseArgs = (argv: string[]): ParsedCommand => {
  const result: ParsedCommand = {
    command: '',
    args: [],
    options: {},
  };

  // Skip node and script path
  const args = argv.slice(2);

  if (args.length === 0) {
    return result;
  }

  // First non-option is the command
  let i = 0;
  if (!args[0].startsWith('-')) {
    result.command = args[0];
    i = 1;
  }

  // Parse remaining args
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long option
      const optName = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result.options[optName] = args[i + 1];
        i += 2;
      } else {
        result.options[optName] = true;
        i++;
      }
    } else if (arg.startsWith('-')) {
      // Short option
      const optName = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result.options[optName] = args[i + 1];
        i += 2;
      } else {
        result.options[optName] = true;
        i++;
      }
    } else {
      // Positional argument
      result.args.push(arg);
      i++;
    }
  }

  return result;
};

// ───────────────────────────────────────────────────────────────
// VALIDATION FUNCTIONS
// ───────────────────────────────────────────────────────────────

const VALID_COMMANDS = ['init', 'watch', 'status', 'logs', 'allow', 'deny', 'test', 'sync', 'login', 'logout'];

const validateCommand = (command: string): boolean => {
  return VALID_COMMANDS.includes(command);
};

const VALID_OPERATIONS = ['read', 'write', 'delete', 'execute', 'list'];

const validateOperation = (operation: string): boolean => {
  return VALID_OPERATIONS.includes(operation);
};

// ───────────────────────────────────────────────────────────────
// TESTS
// ───────────────────────────────────────────────────────────────

describe('CLI Commands', () => {
  describe('Argument Parsing', () => {
    it('should parse command without options', () => {
      const result = parseArgs(['node', 'scopeagent', 'init']);

      expect(result.command).toBe('init');
      expect(result.args).toHaveLength(0);
      expect(Object.keys(result.options)).toHaveLength(0);
    });

    it('should parse command with positional args', () => {
      const result = parseArgs(['node', 'scopeagent', 'test', 'src/app.ts']);

      expect(result.command).toBe('test');
      expect(result.args).toEqual(['src/app.ts']);
    });

    it('should parse long options', () => {
      const result = parseArgs(['node', 'scopeagent', 'watch', '--config', '.scopeagent.yml']);

      expect(result.command).toBe('watch');
      expect(result.options.config).toBe('.scopeagent.yml');
    });

    it('should parse short options', () => {
      const result = parseArgs(['node', 'scopeagent', 'logs', '-n', '50']);

      expect(result.command).toBe('logs');
      expect(result.options.n).toBe('50');
    });

    it('should parse boolean flags', () => {
      const result = parseArgs(['node', 'scopeagent', 'watch', '--verbose', '--no-colors']);

      expect(result.command).toBe('watch');
      expect(result.options.verbose).toBe(true);
      expect(result.options['no-colors']).toBe(true);
    });

    it('should parse mixed options and args', () => {
      const result = parseArgs(['node', 'scopeagent', 'test', 'src/app.ts', '--operation', 'read', '-v']);

      expect(result.command).toBe('test');
      expect(result.args).toEqual(['src/app.ts']);
      expect(result.options.operation).toBe('read');
      expect(result.options.v).toBe(true);
    });

    it('should handle empty args', () => {
      const result = parseArgs(['node', 'scopeagent']);

      expect(result.command).toBe('');
      expect(result.args).toHaveLength(0);
    });
  });

  describe('Command Validation', () => {
    it('should validate known commands', () => {
      expect(validateCommand('init')).toBe(true);
      expect(validateCommand('watch')).toBe(true);
      expect(validateCommand('status')).toBe(true);
      expect(validateCommand('logs')).toBe(true);
      expect(validateCommand('allow')).toBe(true);
      expect(validateCommand('deny')).toBe(true);
      expect(validateCommand('test')).toBe(true);
      expect(validateCommand('sync')).toBe(true);
      expect(validateCommand('login')).toBe(true);
      expect(validateCommand('logout')).toBe(true);
    });

    it('should reject unknown commands', () => {
      expect(validateCommand('invalid')).toBe(false);
      expect(validateCommand('')).toBe(false);
      expect(validateCommand('help')).toBe(false);
    });
  });

  describe('Operation Validation', () => {
    it('should validate known operations', () => {
      expect(validateOperation('read')).toBe(true);
      expect(validateOperation('write')).toBe(true);
      expect(validateOperation('delete')).toBe(true);
      expect(validateOperation('execute')).toBe(true);
      expect(validateOperation('list')).toBe(true);
    });

    it('should reject unknown operations', () => {
      expect(validateOperation('invalid')).toBe(false);
      expect(validateOperation('create')).toBe(false);
      expect(validateOperation('')).toBe(false);
    });
  });

  describe('Init Command', () => {
    it('should parse init with path', () => {
      const result = parseArgs(['node', 'scopeagent', 'init', '/path/to/project']);

      expect(result.command).toBe('init');
      expect(result.args).toEqual(['/path/to/project']);
    });

    it('should parse init with force flag', () => {
      const result = parseArgs(['node', 'scopeagent', 'init', '--force']);

      expect(result.command).toBe('init');
      expect(result.options.force).toBe(true);
    });
  });

  describe('Watch Command', () => {
    it('should parse watch with config option', () => {
      const result = parseArgs(['node', 'scopeagent', 'watch', '-c', 'custom.yml']);

      expect(result.command).toBe('watch');
      expect(result.options.c).toBe('custom.yml');
    });

    it('should parse watch with verbose flag', () => {
      const result = parseArgs(['node', 'scopeagent', 'watch', '--verbose']);

      expect(result.command).toBe('watch');
      expect(result.options.verbose).toBe(true);
    });
  });

  describe('Logs Command', () => {
    it('should parse logs with limit', () => {
      const result = parseArgs(['node', 'scopeagent', 'logs', '--limit', '100']);

      expect(result.command).toBe('logs');
      expect(result.options.limit).toBe('100');
    });

    it('should parse logs with filters', () => {
      const result = parseArgs(['node', 'scopeagent', 'logs', '--operation', 'read', '--result', 'blocked']);

      expect(result.command).toBe('logs');
      expect(result.options.operation).toBe('read');
      expect(result.options.result).toBe('blocked');
    });
  });

  describe('Allow/Deny Commands', () => {
    it('should parse allow with pattern', () => {
      const result = parseArgs(['node', 'scopeagent', 'allow', 'src/**/*.ts']);

      expect(result.command).toBe('allow');
      expect(result.args).toEqual(['src/**/*.ts']);
    });

    it('should parse deny with operation option', () => {
      const result = parseArgs(['node', 'scopeagent', 'deny', '.env*', '--operation', 'read']);

      expect(result.command).toBe('deny');
      expect(result.args).toEqual(['.env*']);
      expect(result.options.operation).toBe('read');
    });
  });

  describe('Test Command', () => {
    it('should parse test with path and operation', () => {
      const result = parseArgs(['node', 'scopeagent', 'test', 'src/app.ts', '-o', 'write']);

      expect(result.command).toBe('test');
      expect(result.args).toEqual(['src/app.ts']);
      expect(result.options.o).toBe('write');
    });
  });

  describe('Sync Command', () => {
    it('should parse sync with pull flag', () => {
      const result = parseArgs(['node', 'scopeagent', 'sync', '--pull']);

      expect(result.command).toBe('sync');
      expect(result.options.pull).toBe(true);
    });

    it('should parse sync with push flag', () => {
      const result = parseArgs(['node', 'scopeagent', 'sync', '--push']);

      expect(result.command).toBe('sync');
      expect(result.options.push).toBe(true);
    });
  });

  describe('Login Command', () => {
    it('should parse login with api-key option', () => {
      const result = parseArgs(['node', 'scopeagent', 'login', '--api-key', 'sa_abc123']);

      expect(result.command).toBe('login');
      expect(result.options['api-key']).toBe('sa_abc123');
    });

    it('should parse login without options (interactive)', () => {
      const result = parseArgs(['node', 'scopeagent', 'login']);

      expect(result.command).toBe('login');
      expect(Object.keys(result.options)).toHaveLength(0);
    });
  });
});
