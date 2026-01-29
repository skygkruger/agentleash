'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH OAUTH CALLBACK
// Handles redirect from Supabase GitHub OAuth
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        // Check for hash-based tokens (implicit flow) or code (PKCE flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = searchParams.get('code');

        let session;

        if (accessToken && refreshToken) {
          // Hash-based implicit flow - set the session from URL params
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError || !data.session) {
            console.error('Session error:', sessionError);
            setError('Failed to complete authentication. Please try again.');
            return;
          }

          session = data.session;
        } else if (accessToken) {
          // Fallback: try to get existing session
          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !data.session) {
            console.error('Session error:', sessionError);
            setError('Failed to complete authentication. Please try again.');
            return;
          }

          session = data.session;
        } else if (code) {
          // PKCE flow - exchange code for session
          const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError || !data.session) {
            console.error('Session error:', sessionError);
            setError('Failed to complete authentication. Please try again.');
            return;
          }

          session = data.session;
        } else {
          setError('Missing authorization data. Please try logging in again.');
          return;
        }

        // Exchange the Supabase access token for an API JWT
        const result = await api.exchangeOAuthToken(session.access_token);

        if (!result.success || !result.data) {
          setError(result.error || 'Failed to exchange OAuth token');
          return;
        }

        // Refresh auth context to pick up the new tokens
        await refresh();

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    }

    handleOAuthCallback();
  }, [router, refresh]);

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
