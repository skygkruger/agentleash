'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SCOPE DETAIL PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useScope, useRules } from '@/lib/hooks';
import { api, Rule } from '@/lib/api';
import { Card, Button, Input, Select, Table, Modal, ConfirmModal, Checkbox } from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';

const OPERATIONS = ['read', 'write', 'delete', 'execute', 'list'];

export default function ScopeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scopeId = params.id as string;

  const { scope, isLoading: scopeLoading, refresh: refreshScope } = useScope(scopeId);
  const { rules, isLoading: rulesLoading, refresh: refreshRules } = useRules(scopeId);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', defaultPolicy: 'deny' });

  // Rule modal
  const [ruleModal, setRuleModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    rule?: Rule;
  }>({ open: false, mode: 'create' });
  const [ruleForm, setRuleForm] = useState({
    pathPattern: '',
    ruleType: 'allow',
    operations: ['read', 'write'],
    reason: '',
  });
  const [ruleLoading, setRuleLoading] = useState(false);

  // Delete modal
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Handle scope update
  const handleUpdateScope = async () => {
    const result = await api.updateScope(scopeId, {
      name: editData.name,
      description: editData.description,
      defaultPolicy: editData.defaultPolicy as 'allow' | 'deny',
    });
    if (result.success) {
      setEditing(false);
      refreshScope();
    }
  };

  // Handle rule submit
  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleLoading(true);

    try {
      if (ruleModal.mode === 'create') {
        const result = await api.createRule(scopeId, {
          pathPattern: ruleForm.pathPattern,
          ruleType: ruleForm.ruleType as 'allow' | 'deny',
          operations: ruleForm.operations,
          reason: ruleForm.reason || undefined,
        });
        if (result.success) {
          setRuleModal({ open: false, mode: 'create' });
          refreshRules();
        }
      } else if (ruleModal.rule) {
        const result = await api.updateRule(scopeId, ruleModal.rule.id, {
          pathPattern: ruleForm.pathPattern,
          ruleType: ruleForm.ruleType as 'allow' | 'deny',
          operations: ruleForm.operations,
          reason: ruleForm.reason || undefined,
        });
        if (result.success) {
          setRuleModal({ open: false, mode: 'create' });
          refreshRules();
        }
      }
    } finally {
      setRuleLoading(false);
    }
  };

  // Handle rule delete
  const handleDeleteRule = async () => {
    if (!deleteRuleId) return;
    setDeleting(true);

    try {
      const result = await api.deleteRule(scopeId, deleteRuleId);
      if (result.success) {
        setDeleteRuleId(null);
        refreshRules();
      }
    } finally {
      setDeleting(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setRuleForm({
      pathPattern: '',
      ruleType: 'allow',
      operations: ['read', 'write'],
      reason: '',
    });
    setRuleModal({ open: true, mode: 'create' });
  };

  // Open edit modal
  const openEditModal = (rule: Rule) => {
    setRuleForm({
      pathPattern: rule.pathPattern,
      ruleType: rule.ruleType,
      operations: rule.operations,
      reason: rule.reason || '',
    });
    setRuleModal({ open: true, mode: 'edit', rule });
  };

  if (scopeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-scope-muted animate-pulse">[~] Loading...</span>
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="text-center py-12">
        <p className="text-scope-coral">[!] Scope not found</p>
        <Link href="/dashboard/scopes" className="text-scope-cyan text-xs mt-2 inline-block">
          ← Back to Scopes
        </Link>
      </div>
    );
  }

  const ruleColumns = [
    {
      key: 'ruleType',
      header: 'TYPE',
      render: (rule: Rule) => (
        <span className={rule.ruleType === 'allow' ? 'text-scope-mint' : 'text-scope-coral'}>
          {rule.ruleType === 'allow' ? '[/]' : '[X]'} {rule.ruleType.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'pathPattern',
      header: 'PATTERN',
      render: (rule: Rule) => (
        <code className="text-scope-amber">{rule.pathPattern}</code>
      ),
    },
    {
      key: 'operations',
      header: 'OPERATIONS',
      render: (rule: Rule) => (
        <span className="text-scope-lavender text-xs">
          {rule.operations.map((op) => op.toUpperCase()).join(', ')}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'REASON',
      render: (rule: Rule) => (
        <span className="text-scope-muted text-xs">{rule.reason || '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (rule: Rule) => (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(rule)}>
            [EDIT]
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteRuleId(rule.id)}
            className="text-scope-coral hover:text-scope-coral"
          >
            [DEL]
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
          <Link href="/dashboard/scopes" className="text-xs text-scope-muted hover:text-scope-amber">
            ← Back to Scopes
          </Link>
          <h1 className="text-xl text-scope-amber mt-2">{scope.name}</h1>
          <p className="text-xs text-scope-muted mt-1">{scope.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => {
            setEditData({
              name: scope.name,
              description: scope.description || '',
              defaultPolicy: scope.defaultPolicy,
            });
            setEditing(true);
          }}>
            [EDIT SCOPE]
          </Button>
        </div>
      </div>

      {/* Scope Info */}
      <Card title="// SCOPE DETAILS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-scope-muted block">Base Path</span>
            <span className="text-scope-text">{scope.basePath}</span>
          </div>
          <div>
            <span className="text-scope-muted block">Default Policy</span>
            <span className={scope.defaultPolicy === 'deny' ? 'text-scope-coral' : 'text-scope-mint'}>
              {scope.defaultPolicy.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-scope-muted block">Status</span>
            <span className={scope.isActive ? 'text-scope-mint' : 'text-scope-muted'}>
              {scope.isActive ? '[/] Active' : '[~] Inactive'}
            </span>
          </div>
          <div>
            <span className="text-scope-muted block">Last Synced</span>
            <span className="text-scope-text">
              {scope.lastSyncedAt ? formatRelativeTime(scope.lastSyncedAt) : 'Never'}
            </span>
          </div>
        </div>
      </Card>

      {/* Rules */}
      <Card
        title="// RULES"
        titleRight={
          <Button size="sm" onClick={openCreateModal}>
            [+ ADD RULE]
          </Button>
        }
      >
        <Table
          columns={ruleColumns}
          data={rules}
          loading={rulesLoading}
          emptyMessage="No rules configured. Add rules to define access permissions."
        />
      </Card>

      {/* Edit Scope Modal */}
      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Edit Scope"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <Input
            label="Description"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
          <Select
            label="Default Policy"
            value={editData.defaultPolicy}
            onChange={(e) => setEditData({ ...editData, defaultPolicy: e.target.value })}
            options={[
              { value: 'deny', label: 'DENY' },
              { value: 'allow', label: 'ALLOW' },
            ]}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              [CANCEL]
            </Button>
            <Button onClick={handleUpdateScope}>
              [SAVE]
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rule Modal */}
      <Modal
        isOpen={ruleModal.open}
        onClose={() => setRuleModal({ open: false, mode: 'create' })}
        title={ruleModal.mode === 'create' ? 'Add Rule' : 'Edit Rule'}
        size="md"
      >
        <form onSubmit={handleRuleSubmit} className="space-y-4">
          <Input
            label="Pattern"
            value={ruleForm.pathPattern}
            onChange={(e) => setRuleForm({ ...ruleForm, pathPattern: e.target.value })}
            placeholder="src/**/*.ts"
            hint="Glob pattern for matching files"
            required
          />

          <Select
            label="Rule Type"
            value={ruleForm.ruleType}
            onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
            options={[
              { value: 'allow', label: 'ALLOW' },
              { value: 'deny', label: 'DENY' },
            ]}
          />

          <div>
            <label className="block text-xs text-scope-muted mb-2">{'// OPERATIONS'}</label>
            <div className="flex flex-wrap gap-4">
              {OPERATIONS.map((op) => (
                <Checkbox
                  key={op}
                  label={op.toUpperCase()}
                  checked={ruleForm.operations.includes(op)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRuleForm({ ...ruleForm, operations: [...ruleForm.operations, op] });
                    } else {
                      setRuleForm({
                        ...ruleForm,
                        operations: ruleForm.operations.filter((o) => o !== op),
                      });
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <Input
            label="Reason"
            value={ruleForm.reason}
            onChange={(e) => setRuleForm({ ...ruleForm, reason: e.target.value })}
            placeholder="Optional reason for this rule"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRuleModal({ open: false, mode: 'create' })}
            >
              [CANCEL]
            </Button>
            <Button type="submit" loading={ruleLoading}>
              [{ruleModal.mode === 'create' ? 'ADD RULE' : 'SAVE'}]
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Rule Confirmation */}
      <ConfirmModal
        isOpen={!!deleteRuleId}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={handleDeleteRule}
        title="Delete Rule"
        message="Are you sure you want to delete this rule?"
        confirmText="DELETE"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
