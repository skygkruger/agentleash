'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH NEW SCOPE PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Button, Input, Textarea, Select } from '@/components/ui';

export default function NewScopePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePath: '',
    defaultPolicy: 'deny',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.createScope({
        name: formData.name,
        description: formData.description || undefined,
        basePath: formData.basePath,
        defaultPolicy: formData.defaultPolicy as 'allow' | 'deny',
      });

      if (result.success && result.data) {
        router.push(`/dashboard/scopes/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create scope');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl text-scope-amber">{'// NEW SCOPE'}</h1>
        <p className="text-xs text-scope-muted mt-1">
          Create a new monitoring scope for your project
        </p>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border border-scope-coral bg-scope-coral/10 text-scope-coral text-xs">
              [!] {error}
            </div>
          )}

          <Input
            label="Scope Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-project-scope"
            hint="A unique name for this scope"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description for this scope..."
            rows={3}
          />

          <Input
            label="Base Path"
            value={formData.basePath}
            onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
            placeholder="/Users/dev/projects/myapp"
            hint="The root directory to monitor"
            required
          />

          <Select
            label="Default Policy"
            value={formData.defaultPolicy}
            onChange={(e) => setFormData({ ...formData, defaultPolicy: e.target.value })}
            options={[
              { value: 'deny', label: 'DENY - Block access by default (recommended)' },
              { value: 'allow', label: 'ALLOW - Allow access by default' },
            ]}
          />

          <div className="border-t border-scope-border pt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              [CANCEL]
            </Button>
            <Button type="submit" loading={loading}>
              [CREATE SCOPE]
            </Button>
          </div>
        </form>
      </Card>

      {/* Help */}
      <Card title="// NEXT STEPS">
        <div className="space-y-2 text-xs text-scope-muted">
          <p>After creating your scope:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Add rules to define what paths are allowed/denied</li>
            <li>Sync the configuration to your CLI with <span className="text-scope-amber">leash sync --pull</span></li>
            <li>Start monitoring with <span className="text-scope-amber">leash watch</span></li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
