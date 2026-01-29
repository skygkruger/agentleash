// ═══════════════════════════════════════════════════════════════
// AGENTLEASH SUPABASE CLIENT
// Lazy initialization to avoid build-time errors when env vars
// are not available (Vercel static prerendering)
// ═══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        '[AgentLeash] Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      );
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  return _supabase;
}

// Proxy that lazily initializes on first property access.
// During build-time prerendering, the pages import this module but
// never call supabase methods (they're in onClick/useEffect), so
// the client is never actually created and no error is thrown.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

export default supabase;
