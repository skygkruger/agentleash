// ═══════════════════════════════════════════════════════════════
// INTEGRATIONS INDEX
// Export all integration modules
// ═══════════════════════════════════════════════════════════════

export {
  VaultAgentIntegration,
  isVaultAgentAvailable,
  getVaultAgentProtectedPaths,
  getCombinedSecurityStatus,
} from './vaultagent';

export type {
  VaultAgentConfig,
  VaultAgentSession,
  VaultAgentStatus,
  CombinedLog,
  LinkedSessionInfo,
} from './vaultagent';
