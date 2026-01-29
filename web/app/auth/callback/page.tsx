'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH OAUTH CALLBACK
// Handles redirect from Supabase GitHub OAuth
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        // Supabase automatically picks up the hash params from the OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Failed to complete authentication. Please try again.');
          return;
        }

        // Exchange the Supabase access token for an API JWT
        const result = await api.exchangeOAuthToken(session.access_token);

        if (!result.success || !result.data) {
          setError(result.error || 'Failed to exchange OAuth token');
          return;
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } catch {
        setError('Authentication failed. Please try again.');
      }
    }

    handleOAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="border border-scope-coral p-6 text-center">
            <p className="text-scope-coral text-xs mb-4">[!] {error}</p>
            <a
              href="/login"
              className="text-xs text-scope-amber hover:underline"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="border border-scope-amber p-6">
          <p className="text-xs text-scope-muted">Completing authentication...</p>
          <div className="mt-4 text-scope-amber animate-pulse">[ ... ]</div>
        </div>
      </div>
    </div>
  );
}
