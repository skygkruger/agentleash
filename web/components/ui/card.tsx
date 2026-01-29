'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT CARD COMPONENT
// Retro terminal styled card with ASCII borders
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  titleRight?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'amber' | 'mint' | 'coral' | 'lavender';
}

export function Card({
  children,
  title,
  titleRight,
  className,
  variant = 'default',
}: CardProps) {
  const borderColor = {
    default: 'border-scope-border',
    amber: 'border-scope-amber',
    mint: 'border-scope-mint',
    coral: 'border-scope-coral',
    lavender: 'border-scope-lavender',
  };

  const titleColor = {
    default: 'text-scope-text',
    amber: 'text-scope-amber',
    mint: 'text-scope-mint',
    coral: 'text-scope-coral',
    lavender: 'text-scope-lavender',
  };

  return (
    <div
      className={cn(
        'border bg-scope-bg-card',
        borderColor[variant],
        className
      )}
    >
      {title && (
        <div className={cn('border-b px-4 py-2 flex items-center justify-between', borderColor[variant])}>
          <span className={cn('text-xs font-medium', titleColor[variant])}>
            {title}
          </span>
          {titleRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export function StatCard({
  label,
  value,
  icon = '[#]',
  change,
  changeType = 'neutral',
  className,
}: StatCardProps) {
  const changeColor = {
    positive: 'text-scope-mint',
    negative: 'text-scope-coral',
    neutral: 'text-scope-muted',
  };

  return (
    <div
      className={cn(
        'border border-scope-border bg-scope-bg-card p-4',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-scope-amber text-lg">{icon}</span>
        {change && (
          <span className={cn('text-xs', changeColor[changeType])}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-scope-text">{value}</p>
        <p className="text-xs text-scope-muted mt-1">{label}</p>
      </div>
    </div>
  );
}

interface TerminalCardProps {
  children: React.ReactNode;
  title?: string;
  status?: 'watching' | 'stopped' | 'error' | 'success';
  className?: string;
}

export function TerminalCard({
  children,
  title = 'SCOPEAGENT',
  status,
  className,
}: TerminalCardProps) {
  const statusText = {
    watching: { text: 'WATCHING...', color: 'text-scope-mint' },
    stopped: { text: 'STOPPED', color: 'text-scope-muted' },
    error: { text: 'ERROR', color: 'text-scope-coral' },
    success: { text: 'SUCCESS', color: 'text-scope-mint' },
  };

  return (
    <div className={cn('font-mono text-xs', className)}>
      <pre className="text-scope-amber leading-tight">
{`╔══════════════════════════════════════════════════════════════════════════════╗
║  ${title.padEnd(48)}${status ? `[${statusText[status].text}]`.padStart(18) : ''.padStart(18)}   ║
╠══════════════════════════════════════════════════════════════════════════════╣`}
      </pre>
      <div className="border-x border-scope-amber px-6 py-6 bg-scope-bg-card">
        {children}
      </div>
      <pre className="text-scope-amber leading-tight">
{`╚══════════════════════════════════════════════════════════════════════════════╝`}
      </pre>
    </div>
  );
}

export default Card;
