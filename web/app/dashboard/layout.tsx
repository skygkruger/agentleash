'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT DASHBOARD LAYOUT
// ═══════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header, Sidebar } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <pre className="text-xs text-scope-amber animate-pulse">
{`╔════════════════════════════════════╗
║      LOADING SCOPEAGENT...         ║
╚════════════════════════════════════╝`}
          </pre>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header variant="dashboard" />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
