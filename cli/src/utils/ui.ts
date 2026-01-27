// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT CLI UI UTILITIES
// Terminal output helpers with retro styling
// ═══════════════════════════════════════════════════════════════

import chalk from 'chalk';
import boxen from 'boxen';
import ora, { Ora } from 'ora';

// ───────────────────────────────────────────────────────────────
// COLORS
// ───────────────────────────────────────────────────────────────

export const colors = {
  amber: chalk.hex('#d4a76a'),
  mint: chalk.hex('#a8d8b9'),
  coral: chalk.hex('#eb6f92'),
  lavender: chalk.hex('#c4a7e7'),
  cyan: chalk.hex('#7eb8da'),
  cream: chalk.hex('#ffe9b0'),
  muted: chalk.hex('#6e6a86'),
  text: chalk.hex('#e8e3e3'),
};

// ───────────────────────────────────────────────────────────────
// STATUS ICONS
// ───────────────────────────────────────────────────────────────

export const icons = {
  allowed: colors.mint('[/]'),
  blocked: colors.coral('[X]'),
  warning: colors.cream('[!]'),
  watching: colors.amber('[*]'),
  pending: colors.muted('[~]'),
  help: colors.lavender('[?]'),
  add: colors.mint('[+]'),
  config: colors.amber('[#]'),
  action: colors.cyan('[>]'),
  info: colors.cyan('[i]'),
  success: colors.mint('[✓]'),
  error: colors.coral('[✗]'),
};

// ───────────────────────────────────────────────────────────────
// ASCII BANNER
// ───────────────────────────────────────────────────────────────

export const banner = colors.amber(`
███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
`) + colors.muted(`         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘`);

// ───────────────────────────────────────────────────────────────
// BOX DRAWING
// ───────────────────────────────────────────────────────────────

export function box(content: string, title?: string): string {
  return boxen(content, {
    padding: 1,
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle: 'double',
    borderColor: '#d4a76a',
    title: title ? colors.amber(title) : undefined,
    titleAlignment: 'left',
  });
}

export function infoBox(content: string, title?: string): string {
  return boxen(content, {
    padding: 1,
    borderStyle: 'round',
    borderColor: '#7eb8da',
    title: title ? colors.cyan(title) : undefined,
    titleAlignment: 'left',
  });
}

export function errorBox(content: string): string {
  return boxen(content, {
    padding: 1,
    borderStyle: 'round',
    borderColor: '#eb6f92',
    title: colors.coral('Error'),
    titleAlignment: 'left',
  });
}

export function successBox(content: string): string {
  return boxen(content, {
    padding: 1,
    borderStyle: 'round',
    borderColor: '#a8d8b9',
    title: colors.mint('Success'),
    titleAlignment: 'left',
  });
}

// ───────────────────────────────────────────────────────────────
// SPINNER
// ───────────────────────────────────────────────────────────────

export function spinner(text: string): Ora {
  return ora({
    text: colors.text(text),
    spinner: 'dots',
    color: 'yellow',
  });
}

// ───────────────────────────────────────────────────────────────
// TABLE FORMATTING
// ───────────────────────────────────────────────────────────────

export function table(headers: string[], rows: string[][]): string {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxRow = Math.max(...rows.map((r) => (r[i] || '').length));
    return Math.max(h.length, maxRow);
  });

  // Build header
  const headerLine = headers
    .map((h, i) => colors.amber(h.padEnd(widths[i])))
    .join('  ');

  // Build separator
  const separator = widths.map((w) => colors.muted('─'.repeat(w))).join('──');

  // Build rows
  const dataLines = rows
    .map((row) =>
      row.map((cell, i) => colors.text((cell || '').padEnd(widths[i]))).join('  ')
    )
    .join('\n');

  return `${headerLine}\n${separator}\n${dataLines}`;
}

// ───────────────────────────────────────────────────────────────
// LOG LINE FORMATTING
// ───────────────────────────────────────────────────────────────

export function logLine(
  result: 'allowed' | 'blocked' | 'warning',
  operation: string,
  path: string,
  timestamp?: string
): string {
  const icon = result === 'allowed' ? icons.allowed : result === 'blocked' ? icons.blocked : icons.warning;
  const opColor = result === 'allowed' ? colors.mint : result === 'blocked' ? colors.coral : colors.cream;
  const time = timestamp ? colors.muted(`[${timestamp}]`) : '';

  return `${icon} ${opColor(operation.toUpperCase().padEnd(7))} ${colors.text(path)} ${time}`;
}

// ───────────────────────────────────────────────────────────────
// STATUS HEADER
// ───────────────────────────────────────────────────────────────

export function statusHeader(
  status: 'watching' | 'stopped' | 'error',
  scopeName?: string
): string {
  const statusText =
    status === 'watching'
      ? colors.mint('WATCHING')
      : status === 'stopped'
      ? colors.muted('STOPPED')
      : colors.coral('ERROR');

  const lines = [
    '╔══════════════════════════════════════════════════════════════════════════════╗',
    `║  ${colors.amber('SCOPEAGENT')}                                          [${statusText}]   ║`,
    '╠══════════════════════════════════════════════════════════════════════════════╣',
  ];

  if (scopeName) {
    lines.push(`║  Scope: ${colors.text(scopeName.padEnd(67))} ║`);
  }

  lines.push('╚══════════════════════════════════════════════════════════════════════════════╝');

  return lines.join('\n');
}

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

export function print(message: string): void {
  console.log(message);
}

export function printBanner(): void {
  console.log(banner);
  console.log('');
}

export function printError(message: string): void {
  console.log(errorBox(message));
}

export function printSuccess(message: string): void {
  console.log(successBox(message));
}

export function printInfo(message: string): void {
  console.log(`${icons.info} ${colors.text(message)}`);
}

export function printWarning(message: string): void {
  console.log(`${icons.warning} ${colors.cream(message)}`);
}

export function newLine(): void {
  console.log('');
}

// ───────────────────────────────────────────────────────────────
// RULE DISPLAY
// ───────────────────────────────────────────────────────────────

export function formatRule(
  type: 'allow' | 'deny',
  pattern: string,
  operations: string[],
  reason?: string
): string {
  const icon = type === 'allow' ? icons.allowed : icons.blocked;
  const typeColor = type === 'allow' ? colors.mint : colors.coral;
  const ops = operations.map((o) => colors.lavender(o.toUpperCase())).join(', ');

  let line = `${icon} ${typeColor(type.toUpperCase().padEnd(5))} ${colors.text(pattern)} ${colors.muted('→')} ${ops}`;

  if (reason) {
    line += `\n    ${colors.muted(reason)}`;
  }

  return line;
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default {
  colors,
  icons,
  banner,
  box,
  infoBox,
  errorBox,
  successBox,
  spinner,
  table,
  logLine,
  statusHeader,
  print,
  printBanner,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  newLine,
  formatRule,
};
