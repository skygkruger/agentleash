'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT VIOLATIONS PAGE
// Security violations and alerts
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useScopes, useViolations } from '@/lib/hooks';
import { api, Violation, ViolationSummary } from '@/lib/api';
import { Card, Button, Select, Table, Modal, StatCard } from '@/components/ui';
import { cn, formatRelativeTime, getSeverityColor } from '@/lib/utils';

export default function ViolationsPage() {
  const { scopes } = useScopes();
  const [selectedScopeId, setSelectedScopeId] = useState<string>('');
  const [filter, setFilter] = useState({ severity: '', acknowledged: '' });
  const [summary, setSummary] = useState<ViolationSummary | null>(null);
  const [detailModal, setDetailModal] = useState<{ open: boolean; violation: Violation | null }>({
    open: false,
    violation: null,
  });
  const [acknowledging, setAcknowledging] = useState(false);

  // Set first scope as selected
  useEffect(() => {
    if (scopes.length > 0 && !selectedScopeId) {
      setSelectedScopeId(scopes[0].id);
    }
  }, [scopes, selectedScopeId]);

  const { violations, isLoading, refresh } = useViolations(selectedScopeId);

  // Fetch summary
  useEffect(() => {
    if (selectedScopeId) {
      api.getViolationSummary(selectedScopeId).then((result) => {
        if (result.success && result.data) {
          setSummary(result.data);
        }
      });
    }
  }, [selectedScopeId]);

  // Filter violations
  const filteredViolations = violations?.filter((v: any) => {
    if (filter.severity && v.severity !== filter.severity) return false;
    if (filter.acknowledged === 'true' && !v.acknowledged) return false;
    if (filter.acknowledged === 'false' && v.acknowledged) return false;
    return true;
  }) || [];

  // Handle acknowledge
  const handleAcknowledge = async (violationId: string) => {
    setAcknowledging(true);
    try {
      const result = await api.acknowledgeViolation(selectedScopeId, violationId);
      if (result.success) {
        refresh();
        setDetailModal({ open: false, violation: null });
      }
    } finally {
      setAcknowledging(false);
    }
  };

  const columns = [
    {
      key: 'severity',
      header: 'SEV',
      width: '80px',
      render: (v: Violation) => (
        <span className={cn('text-xs uppercase', getSeverityColor(v.severity))}>
          [{v.severity}]
        </span>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (v: Violation) => (
        <span className="text-scope-lavender text-xs">{v.type}</span>
      ),
    },
    {
      key: 'description',
      header: 'DESCRIPTION',
      render: (v: Violation) => (
        <span className="text-scope-text text-xs">{v.description}</span>
      ),
    },
    {
      key: 'acknowledged',
      header: 'STATUS',
      render: (v: Violation) => (
        <span className={v.acknowledged ? 'text-scope-mint' : 'text-scope-cream'}>
          {v.acknowledged ? '[/] Acknowledged' : '[!] Open'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'TIME',
      render: (v: Violation) => (
        <span className="text-scope-muted text-xs">
          {formatRelativeTime(v.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (v: Violation) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDetailModal({ open: true, violation: v })}
        >
          [VIEW]
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-scope-amber">{'// VIOLATIONS'}</h1>
          <p className="text-xs text-scope-muted mt-1">
            Security alerts and policy violations
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
        </div>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="[!]"
            label="Total Violations"
            value={summary.total}
          />
          <StatCard
            icon="[X]"
            label="Unacknowledged"
            value={summary.unacknowledged}
            changeType={summary.unacknowledged > 0 ? 'negative' : 'positive'}
          />
          <StatCard
            icon="[!]"
            label="Critical"
            value={summary.bySeverity?.critical || 0}
            changeType={(summary.bySeverity?.critical || 0) > 0 ? 'negative' : 'neutral'}
          />
          <StatCard
            icon="[!]"
            label="High"
            value={summary.bySeverity?.high || 0}
            changeType={(summary.bySeverity?.high || 0) > 0 ? 'negative' : 'neutral'}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="text-xs text-scope-muted">Filters:</span>
          <Select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            options={[
              { value: '', label: 'All Severities' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            className="w-32"
          />
          <Select
            value={filter.acknowledged}
            onChange={(e) => setFilter({ ...filter, acknowledged: e.target.value })}
            options={[
              { value: '', label: 'All Status' },
              { value: 'false', label: 'Open' },
              { value: 'true', label: 'Acknowledged' },
            ]}
            className="w-32"
          />
          {(filter.severity || filter.acknowledged) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ severity: '', acknowledged: '' })}
            >
              [CLEAR]
            </Button>
          )}
        </div>
      </Card>

      {/* Violations Table */}
      <Card title="// VIOLATION REPORTS">
        <Table
          columns={columns}
          data={filteredViolations}
          loading={isLoading}
          emptyMessage="No violations found. That's good news!"
        />
      </Card>

      {/* No violations message */}
      {!isLoading && violations?.length === 0 && (
        <Card variant="mint">
          <div className="text-center py-4">
            <span className="text-scope-mint text-2xl">[/]</span>
            <p className="text-scope-mint mt-2">No violations detected</p>
            <p className="text-xs text-scope-muted mt-1">
              Your agents are staying within bounds
            </p>
          </div>
        </Card>
      )}

      {/* Violation Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, violation: null })}
        title="Violation Details"
        size="lg"
      >
        {detailModal.violation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-scope-muted">Severity</span>
                <p className={cn('mt-1', getSeverityColor(detailModal.violation.severity))}>
                  {detailModal.violation.severity.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-scope-muted">Type</span>
                <p className="text-scope-text mt-1">{detailModal.violation.type}</p>
              </div>
              <div>
                <span className="text-scope-muted">Status</span>
                <p className={cn('mt-1', detailModal.violation.acknowledged ? 'text-scope-mint' : 'text-scope-cream')}>
                  {detailModal.violation.acknowledged ? 'Acknowledged' : 'Open'}
                </p>
              </div>
              <div>
                <span className="text-scope-muted">Time</span>
                <p className="text-scope-text mt-1">
                  {formatRelativeTime(detailModal.violation.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs text-scope-muted">Description</span>
              <p className="text-scope-text mt-1">{detailModal.violation.description}</p>
            </div>

            {detailModal.violation.affectedPaths && detailModal.violation.affectedPaths.length > 0 && (
              <div>
                <span className="text-xs text-scope-muted">Affected Paths</span>
                <ul className="mt-1 space-y-1">
                  {detailModal.violation.affectedPaths.map((path, i) => (
                    <li key={i} className="text-xs text-scope-amber font-mono">
                      {path}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detailModal.violation.recommendedAction && (
              <div>
                <span className="text-xs text-scope-muted">Recommended Action</span>
                <p className="text-scope-cyan mt-1">{detailModal.violation.recommendedAction}</p>
              </div>
            )}

            {!detailModal.violation.acknowledged && (
              <div className="pt-4 border-t border-scope-border">
                <Button
                  onClick={() => handleAcknowledge(detailModal.violation!.id)}
                  loading={acknowledging}
                >
                  [ACKNOWLEDGE]
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
