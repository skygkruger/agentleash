'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT LOGIN PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <pre className="text-xs text-scope-amber leading-tight">
{`███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝`}
            </pre>
          </Link>
        </div>

        {/* Login Form */}
        <div className="border border-scope-amber">
          <div className="border-b border-scope-amber px-4 py-2">
            <span className="text-xs text-scope-amber">LOGIN</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 border border-scope-coral bg-scope-coral/10 text-scope-coral text-xs">
                [!] {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              [LOGIN]
            </Button>

            <div className="text-center">
              <Link
                href="/register"
                className="text-xs text-scope-muted hover:text-scope-amber"
              >
                Don't have an account? [REGISTER]
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-scope-muted hover:text-scope-amber"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
