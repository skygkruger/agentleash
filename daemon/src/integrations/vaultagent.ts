// ═══════════════════════════════════════════════════════════════
// VAULTAGENT INTEGRATION
// Cross-product integration for complete AI agent security
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'yaml';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface VaultAgentConfig {
  version: number;
  vault_path?: string;
  secret_patterns?: string[];
  protected_files?: string[];
}

export interface VaultAgentSession {
  id: string;
  agentName: string;
  startedAt: Date;
  secretsAccessed: number;
  violations: number;
}

export interface CombinedLog {
  timestamp: Date;
  source: 'scopeagent' | 'vaultagent';
  type: 'access' | 'violation';
  description: string;
  path?: string;
  result?: 'allowed' | 'blocked' | 'warning';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface VaultAgentStatus {
  installed: boolean;
  configured: boolean;
  running: boolean;
  version?: string;
  protectedPaths: string[];
  linkedSession?: string;
}

export interface LinkedSessionInfo {
  scopeSessionId: string;
  vaultSessionId: string;
  linkedAt: Date;
}

// ───────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────

const VAULTAGENT_CONFIG_NAME = '.vaultagent.yml';
const VAULTAGENT_HOME = path.join(os.homedir(), '.vaultagent');
const VAULTAGENT_CREDENTIALS = path.join(VAULTAGENT_HOME, 'credentials');
const VAULTAGENT_API_URL = process.env.VAULTAGENT_API_URL || 'http://localhost:3002';

// Default secret patterns that VaultAgent typically protects
const DEFAULT_SECRET_PATTERNS = [
  '.env',
  '.env.*',
  '*.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  '**/*.key',
  '**/*.pem',
  '**/credentials*',
  '**/secrets*',
  '**/.aws/*',
  '**/.ssh/*',
  '**/id_rsa',
  '**/id_rsa.pub',
  '**/id_ed25519',
  '**/id_ed25519.pub',
];

// ───────────────────────────────────────────────────────────────
// VAULTAGENT INTEGRATION CLASS
// ───────────────────────────────────────────────────────────────

export class VaultAgentIntegration {
  private basePath: string;
  private apiUrl: string;
  private apiToken: string | null = null;
  private linkedSession: LinkedSessionInfo | null = null;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
    this.apiUrl = VAULTAGENT_API_URL;
    this.loadCredentials();
  }

  // ─────────────────────────────────────────────────────────────
  // CREDENTIAL MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  /**
   * Load VaultAgent API credentials from stored file
   */
  private loadCredentials(): void {
    try {
      if (fs.existsSync(VAULTAGENT_CREDENTIALS)) {
        const content = fs.readFileSync(VAULTAGENT_CREDENTIALS, 'utf-8');
        const data = JSON.parse(content);
        this.apiToken = data.apiToken || null;
      }
    } catch {
      // Credentials not available
      this.apiToken = null;
    }
  }

  /**
   * Save linked session info
   */
  private saveLinkedSession(info: LinkedSessionInfo): void {
    const sessionFile = path.join(this.basePath, '.scopeagent-vault-link');
    try {
      fs.writeFileSync(sessionFile, JSON.stringify(info, null, 2), 'utf-8');
      this.linkedSession = info;
    } catch {
      // Failed to save, continue anyway
    }
  }

  /**
   * Load linked session info
   */
  private loadLinkedSession(): LinkedSessionInfo | null {
    const sessionFile = path.join(this.basePath, '.scopeagent-vault-link');
    try {
      if (fs.existsSync(sessionFile)) {
        const content = fs.readFileSync(sessionFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch {
      // Failed to load
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // DETECTION
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if VaultAgent is configured in this project or globally
   */
  async detectVaultAgent(): Promise<boolean> {
    // Check for local config
    const localConfig = path.join(this.basePath, VAULTAGENT_CONFIG_NAME);
    if (fs.existsSync(localConfig)) {
      return true;
    }

    // Check for global config
    const globalConfig = path.join(VAULTAGENT_HOME, 'config.yml');
    if (fs.existsSync(globalConfig)) {
      return true;
    }

    // Check if VaultAgent CLI is installed
    try {
      const { execSync } = await import('child_process');
      execSync('vaultagent --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed VaultAgent status
   */
  async getStatus(): Promise<VaultAgentStatus> {
    const installed = await this.isInstalled();
    const configured = await this.isConfigured();
    const running = await this.isRunning();
    const version = installed ? await this.getVersion() : undefined;
    const protectedPaths = await this.getProtectedPaths();
    const linkedSession = this.loadLinkedSession()?.vaultSessionId;

    return {
      installed,
      configured,
      running,
      version,
      protectedPaths,
      linkedSession,
    };
  }

  /**
   * Check if VaultAgent CLI is installed
   */
  private async isInstalled(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('vaultagent --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if VaultAgent is configured
   */
  private async isConfigured(): Promise<boolean> {
    const localConfig = path.join(this.basePath, VAULTAGENT_CONFIG_NAME);
    const globalConfig = path.join(VAULTAGENT_HOME, 'config.yml');
    return fs.existsSync(localConfig) || fs.existsSync(globalConfig);
  }

  /**
   * Check if VaultAgent daemon is running
   */
  private async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get VaultAgent version
   */
  private async getVersion(): Promise<string | undefined> {
    try {
      const { execSync } = await import('child_process');
      const output = execSync('vaultagent --version', { stdio: 'pipe' }).toString().trim();
      return output.replace('vaultagent ', '');
    } catch {
      return undefined;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PROTECTED PATHS
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all paths that VaultAgent protects
   */
  async getProtectedPaths(): Promise<string[]> {
    const paths: string[] = [];

    // Try to read VaultAgent config
    const config = await this.loadVaultAgentConfig();

    if (config) {
      // Add patterns from config
      if (config.secret_patterns) {
        paths.push(...config.secret_patterns);
      }
      if (config.protected_files) {
        paths.push(...config.protected_files);
      }
    }

    // If no config found, use defaults
    if (paths.length === 0) {
      paths.push(...DEFAULT_SECRET_PATTERNS);
    }

    // Remove duplicates
    return [...new Set(paths)];
  }

  /**
   * Load VaultAgent configuration
   */
  private async loadVaultAgentConfig(): Promise<VaultAgentConfig | null> {
    // Try local config first
    const localConfig = path.join(this.basePath, VAULTAGENT_CONFIG_NAME);
    if (fs.existsSync(localConfig)) {
      try {
        const content = fs.readFileSync(localConfig, 'utf-8');
        return yaml.parse(content) as VaultAgentConfig;
      } catch {
        // Invalid config
      }
    }

    // Try global config
    const globalConfig = path.join(VAULTAGENT_HOME, 'config.yml');
    if (fs.existsSync(globalConfig)) {
      try {
        const content = fs.readFileSync(globalConfig, 'utf-8');
        return yaml.parse(content) as VaultAgentConfig;
      } catch {
        // Invalid config
      }
    }

    return null;
  }

  /**
   * Generate deny rules for VaultAgent protected paths
   */
  async generateDenyRules(): Promise<Array<{
    path: string;
    type: 'deny';
    operations: string[];
    reason: string;
  }>> {
    const protectedPaths = await this.getProtectedPaths();

    return protectedPaths.map((pattern) => ({
      path: pattern,
      type: 'deny' as const,
      operations: ['read', 'write', 'delete'],
      reason: 'VaultAgent protected path',
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // SESSION LINKING
  // ─────────────────────────────────────────────────────────────

  /**
   * Link a ScopeAgent session with a VaultAgent session
   */
  async linkSession(scopeSessionId: string, vaultSessionId: string): Promise<boolean> {
    try {
      // Verify VaultAgent session exists (if API available)
      if (this.apiToken) {
        const response = await fetch(`${this.apiUrl}/api/sessions/${vaultSessionId}`, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        });

        if (!response.ok) {
          console.warn('VaultAgent session not found or not accessible');
          return false;
        }
      }

      // Save link locally
      const linkInfo: LinkedSessionInfo = {
        scopeSessionId,
        vaultSessionId,
        linkedAt: new Date(),
      };

      this.saveLinkedSession(linkInfo);
      return true;
    } catch (error) {
      console.error('Failed to link sessions:', error);
      return false;
    }
  }

  /**
   * Unlink sessions
   */
  unlinkSession(): void {
    const sessionFile = path.join(this.basePath, '.scopeagent-vault-link');
    try {
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
      }
      this.linkedSession = null;
    } catch {
      // Failed to unlink
    }
  }

  /**
   * Get current linked session info
   */
  getLinkedSession(): LinkedSessionInfo | null {
    if (!this.linkedSession) {
      this.linkedSession = this.loadLinkedSession();
    }
    return this.linkedSession;
  }

  // ─────────────────────────────────────────────────────────────
  // COMBINED LOGS
  // ─────────────────────────────────────────────────────────────

  /**
   * Get combined audit logs from both ScopeAgent and VaultAgent
   */
  async getCombinedAuditLogs(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<CombinedLog[]> {
    const logs: CombinedLog[] = [];

    // Get VaultAgent logs if API available
    if (this.apiToken) {
      try {
        const response = await fetch(
          `${this.apiUrl}/api/logs?start=${startDate.toISOString()}&end=${endDate.toISOString()}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json() as { logs?: Array<{ timestamp: string; type: string; description?: string; operation?: string; path: string; result: string; severity?: string }> };
          if (data.logs && Array.isArray(data.logs)) {
            for (const log of data.logs) {
              logs.push({
                timestamp: new Date(log.timestamp),
                source: 'vaultagent',
                type: log.type === 'violation' ? 'violation' : 'access',
                description: log.description || `${log.operation} on ${log.path}`,
                path: log.path,
                result: log.result as 'allowed' | 'blocked' | 'warning',
                severity: log.severity as 'low' | 'medium' | 'high' | 'critical' | undefined,
              });
            }
          }
        }
      } catch {
        // VaultAgent API not available
      }
    }

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs.slice(0, limit);
  }

  // ─────────────────────────────────────────────────────────────
  // ACCOUNT LINKING
  // ─────────────────────────────────────────────────────────────

  /**
   * Link VaultAgent account with ScopeAgent account
   */
  async linkAccount(vaultAgentApiKey: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify the API key with VaultAgent
      const response = await fetch(`${this.apiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: vaultAgentApiKey }),
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Invalid VaultAgent API key',
        };
      }

      // Save credentials
      if (!fs.existsSync(VAULTAGENT_HOME)) {
        fs.mkdirSync(VAULTAGENT_HOME, { recursive: true });
      }

      fs.writeFileSync(
        VAULTAGENT_CREDENTIALS,
        JSON.stringify({ apiToken: vaultAgentApiKey }, null, 2),
        'utf-8'
      );

      this.apiToken = vaultAgentApiKey;

      return {
        success: true,
        message: 'VaultAgent account linked successfully',
      };
    } catch {
      return {
        success: false,
        message: 'Failed to connect to VaultAgent API',
      };
    }
  }

  /**
   * Check if VaultAgent account is linked
   */
  isAccountLinked(): boolean {
    return this.apiToken !== null;
  }

  /**
   * Unlink VaultAgent account
   */
  unlinkAccount(): void {
    try {
      if (fs.existsSync(VAULTAGENT_CREDENTIALS)) {
        fs.unlinkSync(VAULTAGENT_CREDENTIALS);
      }
      this.apiToken = null;
    } catch {
      // Failed to unlink
    }
  }
}

// ───────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

/**
 * Quick check if VaultAgent is available
 */
export async function isVaultAgentAvailable(basePath?: string): Promise<boolean> {
  const integration = new VaultAgentIntegration(basePath);
  return integration.detectVaultAgent();
}

/**
 * Get VaultAgent protected paths for use in ScopeAgent config
 */
export async function getVaultAgentProtectedPaths(basePath?: string): Promise<string[]> {
  const integration = new VaultAgentIntegration(basePath);
  return integration.getProtectedPaths();
}

/**
 * Get combined status for CLI display
 */
export async function getCombinedSecurityStatus(basePath?: string): Promise<{
  scopeAgent: { active: boolean; rules: number };
  vaultAgent: VaultAgentStatus;
  bundleAvailable: boolean;
}> {
  const integration = new VaultAgentIntegration(basePath);
  const vaultStatus = await integration.getStatus();

  return {
    scopeAgent: {
      active: true, // Assumed active if this code is running
      rules: 0, // To be filled by caller
    },
    vaultAgent: vaultStatus,
    bundleAvailable: vaultStatus.installed && !vaultStatus.configured,
  };
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default VaultAgentIntegration;
