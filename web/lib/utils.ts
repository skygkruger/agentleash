// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT UTILITIES
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// CLASS NAME HELPER
// ───────────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ───────────────────────────────────────────────────────────────
// DATE FORMATTING
// ───────────────────────────────────────────────────────────────

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

// ───────────────────────────────────────────────────────────────
// STRING HELPERS
// ───────────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function padEnd(str: string, length: number): string {
  return str.padEnd(length).slice(0, length);
}

export function padStart(str: string, length: number): string {
  return str.padStart(length).slice(-length);
}

// ───────────────────────────────────────────────────────────────
// STATUS HELPERS
// ───────────────────────────────────────────────────────────────

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'allowed':
      return '[/]';
    case 'blocked':
      return '[X]';
    case 'warning':
      return '[!]';
    case 'watching':
      return '[*]';
    case 'pending':
      return '[~]';
    default:
      return '[?]';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'allowed':
      return 'text-scope-mint';
    case 'blocked':
      return 'text-scope-coral';
    case 'warning':
      return 'text-scope-cream';
    default:
      return 'text-scope-muted';
  }
}

// ───────────────────────────────────────────────────────────────
// SEVERITY HELPERS
// ───────────────────────────────────────────────────────────────

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-scope-coral';
    case 'high':
      return 'text-[#f5a97f]';
    case 'medium':
      return 'text-scope-cream';
    case 'low':
      return 'text-scope-mint';
    default:
      return 'text-scope-muted';
  }
}

// ───────────────────────────────────────────────────────────────
// NUMBER FORMATTING
// ───────────────────────────────────────────────────────────────

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// ───────────────────────────────────────────────────────────────
// PATH HELPERS
// ───────────────────────────────────────────────────────────────

export function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

export function getDirectory(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}
