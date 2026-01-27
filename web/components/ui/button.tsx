'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT BUTTON COMPONENT
// Retro terminal styled button
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-mono border transition-colors focus:outline-none focus:ring-2 focus:ring-scope-amber focus:ring-offset-2 focus:ring-offset-scope-bg disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'border-scope-amber text-scope-amber hover:bg-scope-amber hover:text-scope-bg',
    secondary:
      'border-scope-border text-scope-muted hover:border-scope-amber hover:text-scope-amber',
    danger:
      'border-scope-coral text-scope-coral hover:bg-scope-coral hover:text-scope-bg',
    ghost:
      'border-transparent text-scope-muted hover:text-scope-amber hover:border-scope-amber',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-pulse">[~]</span>
          {children}
        </span>
      ) : icon ? (
        <span className="flex items-center gap-2">
          {icon}
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
