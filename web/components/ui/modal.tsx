'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT MODAL COMPONENT
// Retro terminal styled modal
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-scope-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full mx-4 border border-scope-amber bg-scope-bg-card',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-scope-amber px-4 py-3">
            <span className="text-sm text-scope-amber">{title}</span>
            <button
              onClick={onClose}
              className="text-scope-muted hover:text-scope-coral transition-colors"
            >
              [X]
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-scope-border px-4 py-3 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}: ConfirmModalProps) {
  const iconMap = {
    danger: { icon: '[X]', color: 'text-scope-coral' },
    warning: { icon: '[!]', color: 'text-scope-cream' },
    info: { icon: '[?]', color: 'text-scope-cyan' },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <span className={cn('text-2xl', iconMap[variant].color)}>
          {iconMap[variant].icon}
        </span>
        <p className="text-sm text-scope-text">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          [{cancelText}]
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          [{confirmText}]
        </Button>
      </div>
    </Modal>
  );
}

export default Modal;
