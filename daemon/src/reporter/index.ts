// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT REPORTER
// Formats and outputs access logs and violations
// ═══════════════════════════════════════════════════════════════

import type { AccessEvent, WatcherStats } from '../watcher';
import type { Violation } from '../evaluator/engine';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface ReporterConfig {
  colors?: boolean;
  timestamps?: boolean;
  verbose?: boolean;
}

// ───────────────────────────────────────────────────────────────
// ANSI COLOR CODES
// ───────────────────────────────────────────────────────────────

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Custom (using 256-color mode)
  amber: '\x1b[38;5;179m',    // #d4a76a
  mint: '\x1b[38;5;151m',     // #a8d8b9
  coral: '\x1b[38;5;204m',    // #eb6f92
  lavender: '\x1b[38;5;183m', // #c4a7e7
  cream: '\x1b[38;5;229m',    // #ffe9b0
  muted: '\x1b[38;5;102m',    // #6e6a86

  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// ───────────────────────────────────────────────────────────────
// REPORTER CLASS
// ───────────────────────────────────────────────────────────────

export class Reporter {
  private config: ReporterConfig;

  constructor(config: ReporterConfig = {}) {
    this.config = {
      colors: config.colors ?? true,
      timestamps: config.timestamps ?? true,
      verbose: config.verbose ?? false,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // COLOR HELPERS
  // ─────────────────────────────────────────────────────────────

  private c(color: keyof typeof COLORS, text: string): string {
    if (!this.config.colors) return text;
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }

  // ─────────────────────────────────────────────────────────────
  // FORMAT ACCESS EVENT
  // ─────────────────────────────────────────────────────────────

  formatAccessEvent(event: AccessEvent): string {
    const time = this.config.timestamps
      ? this.c('muted', this.formatTime(event.timestamp) + '  ')
      : '';

    const icon = this.getStatusIcon(event.result);
    const op = event.operation.toUpperCase().padEnd(7);
    const path = this.truncatePath(event.relativePath, 45);

    let line = `${time}${icon}  ${op} ${path}`;

    if (event.result === 'blocked') {
      line += this.c('coral', '  [BLOCKED]');
    } else if (event.result === 'warning') {
      line += this.c('cream', '  [WARNING]');
    }

    return line;
  }

  // ─────────────────────────────────────────────────────────────
  // FORMAT VIOLATION
  // ─────────────────────────────────────────────────────────────

  formatViolation(violation: Violation): string {
    const severity = this.getSeverityColor(violation.severity);
    const icon = this.c('coral', '[!]');

    const lines = [
      '',
      this.c('coral', '╔══════════════════════════════════════════════════════════════════════════════╗'),
      `${this.c('coral', '║')}  ${icon} ${severity} - ${violation.type.toUpperCase().padEnd(50)} ${this.formatTime(violation.timestamp)}  ${this.c('coral', '║')}`,
      this.c('coral', '╠══════════════════════════════════════════════════════════════════════════════╣'),
      `${this.c('coral', '║')}  ${violation.description.padEnd(74)} ${this.c('coral', '║')}`,
    ];

    if (violation.affectedPaths.length > 0) {
      lines.push(`${this.c('coral', '║')}${''.padEnd(76)}${this.c('coral', '║')}`);
      lines.push(`${this.c('coral', '║')}  ${this.c('muted', 'Affected paths:')}${''.padEnd(59)}${this.c('coral', '║')}`);
      for (const p of violation.affectedPaths.slice(0, 3)) {
        lines.push(`${this.c('coral', '║')}    - ${this.truncatePath(p, 68)}${''.padEnd(Math.max(0, 68 - p.length))}${this.c('coral', '║')}`);
      }
      if (violation.affectedPaths.length > 3) {
        lines.push(`${this.c('coral', '║')}    ${this.c('muted', `... and ${violation.affectedPaths.length - 3} more`)}${''.padEnd(55)}${this.c('coral', '║')}`);
      }
    }

    lines.push(this.c('coral', '╚══════════════════════════════════════════════════════════════════════════════╝'));
    lines.push('');

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────
  // FORMAT STATS
  // ─────────────────────────────────────────────────────────────

  formatStats(stats: WatcherStats): string {
    const lines = [
      '',
      this.c('amber', '┌────────────────────────────────────────────────────────────────────────────────┐'),
      `${this.c('amber', '│')}  ${this.c('bold', 'STATS')}${''.padEnd(71)}${this.c('amber', '│')}`,
      this.c('amber', '├────────────────────────────────────────────────────────────────────────────────┤'),
      `${this.c('amber', '│')}  Total Operations:  ${String(stats.totalOperations).padEnd(10)} Allowed: ${this.c('mint', String(stats.allowedOperations).padEnd(10))} ${this.c('amber', '│')}`,
      `${this.c('amber', '│')}  Blocked:           ${this.c('coral', String(stats.blockedOperations).padEnd(10))} Warnings: ${this.c('cream', String(stats.warnings).padEnd(10))} ${this.c('amber', '│')}`,
      `${this.c('amber', '│')}  Violations:        ${this.c('coral', String(stats.violations).padEnd(10))} Rules: ${String(stats.ruleCount).padEnd(13)} ${this.c('amber', '│')}`,
      this.c('amber', '└────────────────────────────────────────────────────────────────────────────────┘'),
      '',
    ];

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────
  // FORMAT WATCH HEADER
  // ─────────────────────────────────────────────────────────────

  formatWatchHeader(basePath: string, ruleCount: number, scopeName: string): string {
    const status = this.c('mint', '[WATCHING...]');

    const lines = [
      '',
      this.c('amber', '╔══════════════════════════════════════════════════════════════════════════════╗'),
      `${this.c('amber', '║')}  ${this.c('bold', 'SCOPEAGENT')}${''.padEnd(50)}${status}   ${this.c('amber', '║')}`,
      this.c('amber', '╠══════════════════════════════════════════════════════════════════════════════╣'),
      `${this.c('amber', '║')}  Scope: ${scopeName.padEnd(67)} ${this.c('amber', '║')}`,
      `${this.c('amber', '║')}  Path:  ${this.truncatePath(basePath, 67).padEnd(67)} ${this.c('amber', '║')}`,
      `${this.c('amber', '║')}  Rules: ${String(ruleCount).padEnd(3)} active${''.padEnd(57)} ${this.c('amber', '║')}`,
      this.c('amber', '╠══════════════════════════════════════════════════════════════════════════════╣'),
      `${this.c('amber', '║')}${''.padEnd(76)}${this.c('amber', '║')}`,
      `${this.c('amber', '║')}  ${this.c('muted', 'RECENT ACTIVITY')}${''.padEnd(59)}${this.c('amber', '║')}`,
      `${this.c('amber', '║')}  ${this.c('muted', '─'.repeat(70))}   ${this.c('amber', '║')}`,
    ];

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────
  // FORMAT WATCH FOOTER
  // ─────────────────────────────────────────────────────────────

  formatWatchFooter(): string {
    const lines = [
      this.c('amber', '╠══════════════════════════════════════════════════════════════════════════════╣'),
      `${this.c('amber', '║')}  ${this.c('muted', '[q] Quit   [p] Pause   [c] Clear   [r] Rules   [s] Stats   [h] Help')}${''.padEnd(6)}${this.c('amber', '║')}`,
      this.c('amber', '╚══════════════════════════════════════════════════════════════════════════════╝'),
    ];

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────
  // FORMAT LOG LINE (for watch mode)
  // ─────────────────────────────────────────────────────────────

  formatLogLine(event: AccessEvent): string {
    const time = this.c('muted', this.formatTime(event.timestamp));
    const icon = this.getStatusIcon(event.result);
    const op = event.operation.toUpperCase().padEnd(7);
    const path = this.truncatePath(event.relativePath, 40).padEnd(40);

    let suffix = '';
    if (event.result === 'blocked') {
      suffix = this.c('coral', '[BLOCKED]');
    } else if (event.result === 'warning') {
      suffix = this.c('cream', '[WARNING]');
    }

    return `${this.c('amber', '║')}  ${time}  ${icon}  ${op} ${path} ${suffix.padEnd(15)} ${this.c('amber', '║')}`;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private getStatusIcon(result: 'allowed' | 'blocked' | 'warning'): string {
    switch (result) {
      case 'allowed':
        return this.c('mint', '[/]');
      case 'blocked':
        return this.c('coral', '[X]');
      case 'warning':
        return this.c('cream', '[!]');
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return this.c('coral', severity.toUpperCase());
      case 'high':
        return this.c('coral', severity.toUpperCase());
      case 'medium':
        return this.c('cream', severity.toUpperCase());
      case 'low':
        return this.c('mint', severity.toUpperCase());
      default:
        return severity.toUpperCase();
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour12: false });
  }

  private truncatePath(path: string, maxLength: number): string {
    if (path.length <= maxLength) return path;
    return '...' + path.slice(-(maxLength - 3));
  }
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default Reporter;
