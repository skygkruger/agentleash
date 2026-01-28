'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH HEADER COMPONENT
// Top navigation bar
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui';

interface HeaderProps {
  variant?: 'landing' | 'dashboard';
}

export function Header({ variant = 'landing' }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();

  if (variant === 'dashboard') {
    return (
      <header className="border-b border-scope-border bg-scope-bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-scope-amber hover:text-scope-amber/80">
              <pre className="text-xs leading-tight">
{`╔══════════════════╗
║   AGENTLEASH     ║
╚══════════════════╝`}
              </pre>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-scope-muted">
              {user?.email}
            </span>
            <span className="text-xs px-2 py-1 border border-scope-lavender text-scope-lavender">
              {user?.plan?.toUpperCase()}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              [LOGOUT]
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-scope-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="text-scope-amber hover:text-scope-amber/80">
            <pre className="text-xs">
{`╔════════════════╗
║  AGENTLEASH    ║
╚════════════════╝`}
            </pre>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-xs text-scope-muted hover:text-scope-amber transition-colors"
            >
              [DOCS]
            </Link>
            <Link
              href="/pricing"
              className="text-xs text-scope-muted hover:text-scope-amber transition-colors"
            >
              [PRICING]
            </Link>
            <a
              href="https://github.com/skygkruger/agentleash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-scope-muted hover:text-scope-amber transition-colors"
            >
              [GITHUB]
            </a>

            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm">[DASHBOARD]</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    [LOGIN]
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">[GET STARTED]</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
