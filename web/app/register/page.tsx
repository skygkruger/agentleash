'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH REGISTER PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const result = await register(email, password);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const handleGitHubSignup = async () => {
    setError('');
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      } else if (data?.url) {
        // Redirect to GitHub OAuth
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('GitHub signup error:', err);
      setError('Failed to initiate GitHub signup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <pre className="text-xs text-scope-amber leading-tight">
{`██╗     ███████╗ █████╗ ███████╗██╗  ██╗
██║     ██╔════╝██╔══██╗██╔════╝██║  ██║
██║     █████╗  ███████║███████╗███████║
██║     ██╔══╝  ██╔══██║╚════██║██╔══██║
███████╗███████╗██║  ██║███████║██║  ██║
╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`}
            </pre>
          </Link>
        </div>

        {/* Register Form */}
        <div className="border border-scope-amber">
          <div className="border-b border-scope-amber px-4 py-2">
            <span className="text-xs text-scope-amber">CREATE ACCOUNT</span>
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
              hint="Minimum 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              [CREATE ACCOUNT]
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-scope-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-scope-bg px-2 text-xs text-scope-muted">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGitHubSignup}
              className="w-full border border-scope-muted px-4 py-2 text-xs text-scope-text hover:border-scope-amber hover:text-scope-amber transition-colors"
            >
              [SIGN UP WITH GITHUB]
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-xs text-scope-muted hover:text-scope-amber"
              >
                Already have an account? [LOGIN]
              </Link>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-6 border border-scope-border p-4">
          <p className="text-xs text-scope-muted mb-3">{'// FREE PLAN INCLUDES'}</p>
          <ul className="space-y-2 text-xs">
            <li className="text-scope-mint">[/] 1 scope</li>
            <li className="text-scope-mint">[/] 1,000 logs/day</li>
            <li className="text-scope-mint">[/] Basic monitoring</li>
            <li className="text-scope-mint">[/] CLI access</li>
          </ul>
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
