'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useScopes, useLogs, useViolations } from '@/lib/hooks';
import { Card, StatCard, Button, TerminalCard } from '@/components/ui';
import { cn, formatTime, formatRelativeTime, getStatusIcon, getStatusColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { scopes, isLoading: scopesLoading } = useScopes();
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);

  // Set first scope as selected
  useEffect(() => {
    if (scopes.length > 0 && !selectedScopeId) {
      setSelectedScopeId(scopes[0].id);
    }
  }, [scopes, selectedScopeId]);

  const { logs, isLoading: logsLoading } = useLogs(selectedScopeId || '');
  const { violations, isLoading: violationsLoading } = useViolations(selectedScopeId || '');

  // Calculate stats
  const totalLogs = logs?.length || 0;
  const blockedLogs = logs?.filter((l: any) => l.result === 'blocked').length || 0;
  const allowedLogs = logs?.filter((l: any) => l.result === 'allowed').length || 0;
  const unacknowledgedViolations = violations?.filter((v: any) => !v.acknowledged).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-scope-amber">{'// DASHBOARD'}</h1>
          <p className="text-xs text-scope-muted mt-1">
            Welcome back, {user?.email}
          </p>
        </div>
        <Link href="/dashboard/scopes/new">
          <Button>[+ NEW SCOPE]</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="[#]"
          label="Active Scopes"
          value={scopes.length}
        />
        <StatCard
          icon="[*]"
          label="Operations Today"
          value={totalLogs}
        />
        <StatCard
          icon="[X]"
          label="Blocked"
          value={blockedLogs}
          change={totalLogs > 0 ? `${Math.round((blockedLogs / totalLogs) * 100)}%` : '0%'}
          changeType={blockedLogs > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          icon="[!]"
          label="Violations"
          value={unacknowledgedViolations}
          change={unacknowledgedViolations > 0 ? 'unacknowledged' : ''}
          changeType={unacknowledgedViolations > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Scope Selector */}
      {scopes.length > 0 && (
        <Card title="// ACTIVE SCOPES">
          <div className="flex flex-wrap gap-2">
            {scopes.map((scope: any) => (
              <button
                key={scope.id}
                onClick={() => setSelectedScopeId(scope.id)}
                className={cn(
                  'px-3 py-2 text-xs border transition-colors',
                  selectedScopeId === scope.id
                    ? 'border-scope-amber text-scope-amber bg-scope-amber/10'
                    : 'border-scope-border text-scope-muted hover:border-scope-amber hover:text-scope-amber'
                )}
              >
                {scope.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card title="// RECENT ACTIVITY" titleRight={
          <Link href="/dashboard/activity" className="text-xs text-scope-cyan hover:text-scope-amber">
            [VIEW ALL]
          </Link>
        }>
          {logsLoading ? (
            <div className="py-8 text-center text-scope-muted animate-pulse">
              [~] Loading...
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.slice(0, 10).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 py-2 border-b border-scope-border-light last:border-0"
                >
                  <span className={getStatusColor(log.result)}>
                    {getStatusIcon(log.result)}
                  </span>
                  <span className="text-xs text-scope-lavender uppercase w-16">
                    {log.operation}
                  </span>
                  <span className="text-xs text-scope-text flex-1 truncate">
                    {log.filePath}
                  </span>
                  <span className="text-xs text-scope-muted">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-scope-muted">
              <p>[~] No activity yet</p>
              <p className="mt-2 text-xs">Start the daemon to begin monitoring</p>
            </div>
          )}
        </Card>

        {/* Violations */}
        <Card
          title="// VIOLATIONS"
          variant={unacknowledgedViolations > 0 ? 'coral' : 'default'}
          titleRight={
            <Link href="/dashboard/violations" className="text-xs text-scope-cyan hover:text-scope-amber">
              [VIEW ALL]
            </Link>
          }
        >
          {violationsLoading ? (
            <div className="py-8 text-center text-scope-muted animate-pulse">
              [~] Loading...
            </div>
          ) : violations && violations.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {violations.slice(0, 5).map((violation: any) => (
                <div
                  key={violation.id}
                  className="p-3 border border-scope-border-light"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-xs uppercase',
                      violation.severity === 'critical' && 'text-scope-coral',
                      violation.severity === 'high' && 'text-[#f5a97f]',
                      violation.severity === 'medium' && 'text-scope-cream',
                      violation.severity === 'low' && 'text-scope-mint'
                    )}>
                      [{violation.severity}]
                    </span>
                    <span className="text-xs text-scope-muted">
                      {formatRelativeTime(violation.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-scope-text mt-1">{violation.description}</p>
                  {!violation.acknowledged && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs border border-scope-cream text-scope-cream">
                      UNACKNOWLEDGED
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-scope-mint">
              <p>[/] No violations</p>
              <p className="mt-2 text-xs text-scope-muted">Everything looks good</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Start */}
      {scopes.length === 0 && (
        <TerminalCard title="GETTING STARTED">
          <div className="space-y-4">
            <p className="text-scope-muted">{'// No scopes configured yet. Follow these steps:'}</p>
            <div className="space-y-2">
              <p className="text-scope-text">
                <span className="text-scope-amber">1.</span> Create a scope in the dashboard
              </p>
              <p className="text-scope-text">
                <span className="text-scope-amber">2.</span> Install the CLI:
              </p>
              <pre className="bg-scope-bg-light p-2 text-scope-amber">
                npm install -g agentleash
              </pre>
              <p className="text-scope-text">
                <span className="text-scope-amber">3.</span> Initialize in your project:
              </p>
              <pre className="bg-scope-bg-light p-2 text-scope-amber">
                leash init
              </pre>
              <p className="text-scope-text">
                <span className="text-scope-amber">4.</span> Start watching:
              </p>
              <pre className="bg-scope-bg-light p-2 text-scope-amber">
                leash watch
              </pre>
            </div>
          </div>
        </TerminalCard>
      )}
    </div>
  );
}
