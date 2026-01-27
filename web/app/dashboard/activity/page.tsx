'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT ACTIVITY PAGE
// Access logs and monitoring
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useScopes, useLogs } from '@/lib/hooks';
import { api, Stats } from '@/lib/api';
import { Card, Button, Select, Table, StatCard } from '@/components/ui';
import { cn, formatTime, getStatusIcon, getStatusColor, formatNumber } from '@/lib/utils';

export default function ActivityPage() {
  const { scopes } = useScopes();
  const [selectedScopeId, setSelectedScopeId] = useState<string>('');
  const [filter, setFilter] = useState({ result: '', operation: '' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  // Set first scope as selected
  useEffect(() => {
    if (scopes.length > 0 && !selectedScopeId) {
      setSelectedScopeId(scopes[0].id);
    }
  }, [scopes, selectedScopeId]);

  const { logs, isLoading } = useLogs(selectedScopeId);

  // Fetch stats
  useEffect(() => {
    if (selectedScopeId) {
      api.getStats(selectedScopeId, period).then((result) => {
        if (result.success && result.data) {
          setStats(result.data);
        }
      });
    }
  }, [selectedScopeId, period]);

  // Filter logs
  const filteredLogs = logs?.filter((log: any) => {
    if (filter.result && log.result !== filter.result) return false;
    if (filter.operation && log.operation !== filter.operation) return false;
    return true;
  }) || [];

  const columns = [
    {
      key: 'result',
      header: '',
      width: '40px',
      render: (log: any) => (
        <span className={getStatusColor(log.result)}>
          {getStatusIcon(log.result)}
        </span>
      ),
    },
    {
      key: 'operation',
      header: 'OP',
      width: '80px',
      render: (log: any) => (
        <span className="text-scope-lavender text-xs uppercase">
          {log.operation}
        </span>
      ),
    },
    {
      key: 'filePath',
      header: 'PATH',
      render: (log: any) => (
        <code className="text-scope-text text-xs">{log.filePath}</code>
      ),
    },
    {
      key: 'agentIdentifier',
      header: 'AGENT',
      render: (log: any) => (
        <span className="text-scope-muted text-xs">
          {log.agentIdentifier || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'TIME',
      render: (log: any) => (
        <span className="text-scope-muted text-xs">
          {formatTime(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-scope-amber">{'// ACTIVITY'}</h1>
          <p className="text-xs text-scope-muted mt-1">
            Real-time access logs and statistics
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-xs text-scope-muted">Scope:</span>
          <Select
            value={selectedScopeId}
            onChange={(e) => setSelectedScopeId(e.target.value)}
            options={scopes.map((s: any) => ({ value: s.id, label: s.name }))}
            className="w-48"
          />
          <span className="text-xs text-scope-muted ml-4">Period:</span>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            options={[
              { value: 'hour', label: 'Last Hour' },
              { value: 'day', label: 'Last 24 Hours' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
            ]}
            className="w-40"
          />
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="[*]"
            label="Total Operations"
            value={formatNumber(stats.total)}
          />
          <StatCard
            icon="[/]"
            label="Allowed"
            value={formatNumber(stats.allowed)}
            change={stats.total > 0 ? `${Math.round((stats.allowed / stats.total) * 100)}%` : '0%'}
            changeType="positive"
          />
          <StatCard
            icon="[X]"
            label="Blocked"
            value={formatNumber(stats.blocked)}
            change={stats.total > 0 ? `${Math.round((stats.blocked / stats.total) * 100)}%` : '0%'}
            changeType={stats.blocked > 0 ? 'negative' : 'neutral'}
          />
          <StatCard
            icon="[!]"
            label="Warnings"
            value={formatNumber(stats.warnings)}
          />
        </div>
      )}

      {/* Operations Breakdown */}
      {stats && stats.operations && Object.keys(stats.operations).length > 0 && (
        <Card title="// OPERATIONS BREAKDOWN">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.operations).map(([op, count]) => (
              <div key={op} className="text-center">
                <p className="text-lg text-scope-amber">{formatNumber(count)}</p>
                <p className="text-xs text-scope-muted uppercase">{op}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-xs text-scope-muted">Filters:</span>
          <Select
            value={filter.result}
            onChange={(e) => setFilter({ ...filter, result: e.target.value })}
            options={[
              { value: '', label: 'All Results' },
              { value: 'allowed', label: 'Allowed' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'warning', label: 'Warning' },
            ]}
            className="w-32"
          />
          <Select
            value={filter.operation}
            onChange={(e) => setFilter({ ...filter, operation: e.target.value })}
            options={[
              { value: '', label: 'All Operations' },
              { value: 'read', label: 'Read' },
              { value: 'write', label: 'Write' },
              { value: 'delete', label: 'Delete' },
              { value: 'execute', label: 'Execute' },
              { value: 'list', label: 'List' },
            ]}
            className="w-32"
          />
          {(filter.result || filter.operation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ result: '', operation: '' })}
            >
              [CLEAR]
            </Button>
          )}
        </div>
      </Card>

      {/* Logs Table */}
      <Card title="// ACCESS LOGS">
        <Table
          columns={columns}
          data={filteredLogs}
          loading={isLoading}
          emptyMessage="No logs found. Start the daemon to begin monitoring."
        />
      </Card>
    </div>
  );
}
