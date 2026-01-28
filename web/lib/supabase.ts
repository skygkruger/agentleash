// ═══════════════════════════════════════════════════════════════
// AGENTLEASH SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[AgentLeash] Missing Supabase environment variables. Some features may not work.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
