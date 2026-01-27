'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SCOPES LIST PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import Link from 'next/link';
import { useScopes } from '@/lib/hooks';
import { api } from '@/lib/api';
import { Card, Button, Table, ConfirmModal } from '@/components/ui';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function ScopesPage() {
  const { scopes, isLoading, refresh } = useScopes();
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; scopeId: string | null }>({
    open: false,
    scopeId: null,
  });
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteModal.scopeId) return;

    setDeleting(true);
    try {
      const result = await api.deleteScope(deleteModal.scopeId);
      if (result.success) {
        refresh();
      }
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, scopeId: null });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'NAME',
      render: (scope: any) => (
        <Link
          href={`/dashboard/scopes/${scope.id}`}
          className="text-scope-amber hover:underline"
        >
          {scope.name}
        </Link>
      ),
    },
    {
      key: 'basePath',
      header: 'PATH',
      render: (scope: any) => (
        <span className="text-scope-muted text-xs">{scope.basePath}</span>
      ),
    },
    {
      key: 'defaultPolicy',
      header: 'POLICY',
      render: (scope: any) => (
        <span
          className={
            scope.defaultPolicy === 'deny' ? 'text-scope-coral' : 'text-scope-mint'
          }
        >
          {scope.defaultPolicy.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (scope: any) => (
        <span className={scope.isActive ? 'text-scope-mint' : 'text-scope-muted'}>
          {scope.isActive ? '[/] Active' : '[~] Inactive'}
        </span>
      ),
    },
    {
      key: 'lastSyncedAt',
      header: 'LAST SYNC',
      render: (scope: any) => (
        <span className="text-scope-muted text-xs">
          {scope.lastSyncedAt ? formatRelativeTime(scope.lastSyncedAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (scope: any) => (
        <div className="flex gap-2 justify-end">
          <Link href={`/dashboard/scopes/${scope.id}`}>
            <Button variant="ghost" size="sm">
              [EDIT]
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteModal({ open: true, scopeId: scope.id })}
            className="text-scope-coral hover:text-scope-coral"
          >
            [DELETE]
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-scope-amber">{'// SCOPES'}</h1>
          <p className="text-xs text-scope-muted mt-1">
            Manage your monitoring scopes
          </p>
        </div>
        <Link href="/dashboard/scopes/new">
          <Button>[+ NEW SCOPE]</Button>
        </Link>
      </div>

      {/* Scopes Table */}
      <Card>
        <Table
          columns={columns}
          data={scopes}
          loading={isLoading}
          emptyMessage="No scopes configured. Create your first scope to get started."
        />
      </Card>

      {/* Empty State */}
      {!isLoading && scopes.length === 0 && (
        <Card title="// GETTING STARTED">
          <div className="space-y-4">
            <p className="text-scope-muted">
              Scopes define what paths AI agents can access in your projects.
            </p>
            <div className="space-y-2 text-xs">
              <p className="text-scope-text">
                <span className="text-scope-amber">→</span> Each scope has a base path and a set of rules
              </p>
              <p className="text-scope-text">
                <span className="text-scope-amber">→</span> Rules define allow/deny patterns for file operations
              </p>
              <p className="text-scope-text">
                <span className="text-scope-amber">→</span> The daemon monitors file access against these rules
              </p>
            </div>
            <Link href="/dashboard/scopes/new">
              <Button className="mt-4">[CREATE YOUR FIRST SCOPE]</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, scopeId: null })}
        onConfirm={handleDelete}
        title="Delete Scope"
        message="Are you sure you want to delete this scope? This will remove all associated rules and logs."
        confirmText="DELETE"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
