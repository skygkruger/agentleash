'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SETTINGS PAGE
// Account and API key management
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card, Button, Input, Modal, ConfirmModal } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // New API key modal
  const [keyModal, setKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Delete key modal
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState(false);

  // Fetch API keys
  useEffect(() => {
    api.getApiKeys().then((result) => {
      if (result.success && result.data) {
        setApiKeys(result.data);
      }
      setLoadingKeys(false);
    });
  }, []);

  // Create API key
  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    setCreatingKey(true);

    try {
      const result = await api.createApiKey(keyName);
      if (result.success && result.data) {
        setNewKey(result.data.key);
        setApiKeys([...apiKeys, { id: result.data.id, name: keyName, createdAt: new Date().toISOString() }]);
        setKeyName('');
      }
    } finally {
      setCreatingKey(false);
    }
  };

  // Delete API key
  const handleDeleteKey = async () => {
    if (!deleteKeyId) return;
    setDeletingKey(true);

    try {
      const result = await api.deleteApiKey(deleteKeyId);
      if (result.success) {
        setApiKeys(apiKeys.filter((k) => k.id !== deleteKeyId));
        setDeleteKeyId(null);
      }
    } finally {
      setDeletingKey(false);
    }
  };

  // Plan info
  const planInfo = {
    free: { name: 'Free', scopes: 1, logs: '1,000/day', price: '$0' },
    pro: { name: 'Pro', scopes: 5, logs: '10,000/day', price: '$15/mo' },
    team: { name: 'Team', scopes: 20, logs: '100,000/day', price: '$49/mo' },
    enterprise: { name: 'Enterprise', scopes: 'Unlimited', logs: 'Unlimited', price: '$149/mo' },
  };

  const currentPlan = planInfo[user?.plan || 'free'];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl text-scope-amber">{'// SETTINGS'}</h1>
        <p className="text-xs text-scope-muted mt-1">
          Manage your account and API keys
        </p>
      </div>

      {/* Account Info */}
      <Card title="// ACCOUNT">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-scope-muted">Email</span>
              <p className="text-scope-text mt-1">{user?.email}</p>
            </div>
            <div>
              <span className="text-scope-muted">User ID</span>
              <p className="text-scope-muted mt-1 font-mono">{user?.id}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-scope-border">
            <Button variant="danger" onClick={logout}>
              [LOGOUT]
            </Button>
          </div>
        </div>
      </Card>

      {/* Plan Info */}
      <Card title="// CURRENT PLAN" variant="amber">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-scope-amber">{currentPlan.name}</p>
              <p className="text-xs text-scope-muted">{currentPlan.price}</p>
            </div>
            {user?.plan !== 'enterprise' && (
              <Button variant="secondary">[UPGRADE]</Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-scope-border">
            <div>
              <span className="text-scope-muted">Scopes</span>
              <p className="text-scope-text mt-1">{currentPlan.scopes}</p>
            </div>
            <div>
              <span className="text-scope-muted">Logs</span>
              <p className="text-scope-text mt-1">{currentPlan.logs}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card
        title="// API KEYS"
        titleRight={
          <Button size="sm" onClick={() => setKeyModal(true)}>
            [+ NEW KEY]
          </Button>
        }
      >
        {loadingKeys ? (
          <div className="py-4 text-center text-scope-muted animate-pulse">
            [~] Loading...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="py-4 text-center text-scope-muted">
            <p>No API keys created</p>
            <p className="text-xs mt-1">
              Create an API key to use the CLI without interactive login
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between py-2 border-b border-scope-border-light last:border-0"
              >
                <div>
                  <p className="text-scope-text">{key.name}</p>
                  <p className="text-xs text-scope-muted">
                    Created {formatDate(key.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteKeyId(key.id)}
                  className="text-scope-coral hover:text-scope-coral"
                >
                  [DELETE]
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CLI Usage */}
      <Card title="// CLI USAGE">
        <div className="space-y-4 text-xs">
          <p className="text-scope-muted">Install and use the ScopeAgent CLI:</p>
          <pre className="bg-scope-bg-light p-3 text-scope-amber overflow-x-auto">
{`# Install globally
npm install -g @veridian/scopeagent

# Login with API key
scopeagent login --api-key YOUR_API_KEY

# Or login interactively
scopeagent login

# Initialize in your project
cd your-project
scopeagent init

# Start watching
scopeagent watch`}
          </pre>
        </div>
      </Card>

      {/* Create API Key Modal */}
      <Modal
        isOpen={keyModal}
        onClose={() => {
          setKeyModal(false);
          setNewKey(null);
          setKeyName('');
        }}
        title="Create API Key"
        size="sm"
      >
        {newKey ? (
          <div className="space-y-4">
            <div className="p-3 border border-scope-cream bg-scope-cream/10">
              <p className="text-xs text-scope-cream mb-2">
                [!] Copy this key now - it won't be shown again!
              </p>
              <code className="text-scope-amber break-all">{newKey}</code>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
              }}
              className="w-full"
            >
              [COPY TO CLIPBOARD]
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setKeyModal(false);
                setNewKey(null);
                setKeyName('');
              }}
              className="w-full"
            >
              [DONE]
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Key Name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="my-dev-machine"
              hint="A name to identify this key"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setKeyModal(false)}>
                [CANCEL]
              </Button>
              <Button onClick={handleCreateKey} loading={creatingKey}>
                [CREATE]
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Key Confirmation */}
      <ConfirmModal
        isOpen={!!deleteKeyId}
        onClose={() => setDeleteKeyId(null)}
        onConfirm={handleDeleteKey}
        title="Delete API Key"
        message="Are you sure you want to delete this API key? Any applications using it will lose access."
        confirmText="DELETE"
        variant="danger"
        loading={deletingKey}
      />
    </div>
  );
}
