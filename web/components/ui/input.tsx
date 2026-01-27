'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT INPUT COMPONENT
// Retro terminal styled input
// ═══════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs text-scope-muted">
            {'// '}{label.toUpperCase()}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-scope-muted">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-scope-bg-light border border-scope-border px-3 py-2 text-sm text-scope-text',
              'placeholder:text-scope-muted focus:outline-none focus:border-scope-amber',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix && 'pl-8',
              error && 'border-scope-coral',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-scope-coral">[!] {error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-scope-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs text-scope-muted">
            {'// '}{label.toUpperCase()}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-scope-bg-light border border-scope-border px-3 py-2 text-sm text-scope-text',
            'placeholder:text-scope-muted focus:outline-none focus:border-scope-amber',
            'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
            error && 'border-scope-coral',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-scope-coral">[!] {error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-scope-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs text-scope-muted">
            {'// '}{label.toUpperCase()}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-scope-bg-light border border-scope-border px-3 py-2 text-sm text-scope-text',
            'focus:outline-none focus:border-scope-amber',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-scope-coral',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-scope-coral">[!] {error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className={cn('flex items-center gap-2 cursor-pointer', className)}>
        <input
          ref={ref}
          type="checkbox"
          className="w-4 h-4 accent-scope-amber bg-scope-bg-light border-scope-border"
          {...props}
        />
        <span className="text-sm text-scope-text">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Input;
