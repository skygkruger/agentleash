// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SUPABASE CLIENT
// Database connection and helpers
// ═══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ───────────────────────────────────────────────────────────────
// ENVIRONMENT VALIDATION
// ───────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('[Supabase] Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.warn('[Supabase] Missing SUPABASE_ANON_KEY environment variable');
}

// ───────────────────────────────────────────────────────────────
// CLIENTS
// ───────────────────────────────────────────────────────────────

// Public client (respects RLS)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

// Admin client (bypasses RLS) - use carefully!
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseServiceKey || supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ───────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// DATABASE TYPES
// ───────────────────────────────────────────────────────────────

export interface DbProfile {
  id: string;
  email: string;
  display_name: string | null;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScope {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  base_path: string;
  is_active: boolean;
  config_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScopeRule {
  id: string;
  scope_id: string;
  rule_type: 'allow' | 'deny' | 'readonly' | 'writeonly';
  path_pattern: string;
  operations: string[];
  priority: number;
  reason: string | null;
  created_at: string;
}

export interface DbAccessLog {
  id: string;
  scope_id: string;
  session_id: string | null;
  file_path: string;
  operation: string;
  result: 'allowed' | 'blocked' | 'warning';
  matched_rule_id: string | null;
  agent_identifier: string | null;
  process_name: string | null;
  process_pid: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DbAgentSession {
  id: string;
  scope_id: string;
  session_token: string;
  agent_name: string | null;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  total_operations: number;
  blocked_operations: number;
  last_activity_at: string;
}

export interface DbViolationReport {
  id: string;
  scope_id: string;
  session_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violation_type: string;
  description: string;
  affected_paths: string[] | null;
  recommended_action: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export interface DbTeam {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface DbTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default supabase;
