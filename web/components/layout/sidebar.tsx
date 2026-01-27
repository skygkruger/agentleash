'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SIDEBAR COMPONENT
// Dashboard navigation sidebar
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: '[#]', href: '/dashboard' },
  { label: 'Scopes', icon: '[>]', href: '/dashboard/scopes' },
  { label: 'Activity', icon: '[*]', href: '/dashboard/activity' },
  { label: 'Violations', icon: '[!]', href: '/dashboard/violations' },
  { label: 'Settings', icon: '[@]', href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 border-r border-scope-border bg-scope-bg-card min-h-[calc(100vh-60px)]">
      <nav className="p-4 space-y-1">
        <div className="text-xs text-scope-muted mb-4 px-2">
          {'// NAVIGATION'}
        </div>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
              isActive(item.href)
                ? 'text-scope-amber bg-scope-amber/10 border-l-2 border-scope-amber'
                : 'text-scope-muted hover:text-scope-text hover:bg-scope-bg-light'
            )}
          >
            <span className={isActive(item.href) ? 'text-scope-amber' : 'text-scope-muted'}>
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs bg-scope-coral text-scope-bg rounded">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        <div className="border-t border-scope-border my-4" />

        <div className="text-xs text-scope-muted mb-2 px-2">
          {'// QUICK ACTIONS'}
        </div>

        <Link
          href="/dashboard/scopes/new"
          className="flex items-center gap-3 px-3 py-2 text-sm text-scope-muted hover:text-scope-mint transition-colors"
        >
          <span className="text-scope-mint">[+]</span>
          <span>New Scope</span>
        </Link>

        <a
          href="https://scopeagent.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 text-sm text-scope-muted hover:text-scope-cyan transition-colors"
        >
          <span className="text-scope-cyan">[?]</span>
          <span>Documentation</span>
        </a>
      </nav>

      {/* CLI Install Reminder */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="border border-scope-border p-3 bg-scope-bg">
          <p className="text-xs text-scope-muted mb-2">{'// CLI INSTALL'}</p>
          <pre className="text-xs text-scope-amber bg-scope-bg-light p-2 overflow-x-auto">
            npm i -g @veridian/scopeagent
          </pre>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
