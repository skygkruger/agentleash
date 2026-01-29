// ═══════════════════════════════════════════════════════════════
// AGENTLEASH AGENT VERIFIER (CLI)
// Verifies agent processes are running via OS process list
// ═══════════════════════════════════════════════════════════════

import { execSync } from 'child_process';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface VerificationResult {
  agentId: string;
  verified: boolean;
  processName?: string;
  pid?: number;
  lastVerifiedAt: Date;
}

// Agent process patterns lookup (mirrors shared/constants/agents.ts)
const AGENT_PROCESS_PATTERNS: Record<string, string[]> = {
  'claude-code': ['claude', 'claude-code'],
  'cursor': ['Cursor', 'cursor'],
  'windsurf': ['Windsurf', 'windsurf'],
  'aider': ['aider'],
  'github-copilot': ['copilot-agent', 'Code.exe', 'code'],
  'continue': ['continue', 'Code.exe', 'code'],
};

// ───────────────────────────────────────────────────────────────
// AGENT VERIFIER CLASS
// ───────────────────────────────────────────────────────────────

export class AgentVerifier {
  private agentId: string;
  private processPatterns: string[];
  private periodicTimer: NodeJS.Timeout | null = null;
  private lastResult: VerificationResult | null = null;
  private onStatusChange?: (result: VerificationResult) => void;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.processPatterns = AGENT_PROCESS_PATTERNS[agentId] ?? [];
  }

  verify(): VerificationResult {
    if (this.processPatterns.length === 0) {
      return {
        agentId: this.agentId,
        verified: false,
        lastVerifiedAt: new Date(),
      };
    }

    try {
      const processes = this.getProcessList();

      for (const pattern of this.processPatterns) {
        const match = processes.find(
          (p) => p.name.toLowerCase().includes(pattern.toLowerCase())
        );
        if (match) {
          this.lastResult = {
            agentId: this.agentId,
            verified: true,
            processName: match.name,
            pid: match.pid,
            lastVerifiedAt: new Date(),
          };
          return this.lastResult;
        }
      }
    } catch {
      // Process list command failed
    }

    this.lastResult = {
      agentId: this.agentId,
      verified: false,
      lastVerifiedAt: new Date(),
    };
    return this.lastResult;
  }

  startPeriodicVerification(
    intervalMs: number = 30000,
    onStatusChange?: (result: VerificationResult) => void
  ): void {
    this.onStatusChange = onStatusChange;
    this.periodicTimer = setInterval(() => {
      const wasVerified = this.lastResult?.verified ?? false;
      const result = this.verify();

      if (wasVerified && !result.verified && this.onStatusChange) {
        this.onStatusChange(result);
      }
    }, intervalMs);
  }

  stopPeriodicVerification(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }

  getLastResult(): VerificationResult | null {
    return this.lastResult;
  }

  private getProcessList(): Array<{ name: string; pid: number }> {
    const isWindows = process.platform === 'win32';
    const processes: Array<{ name: string; pid: number }> = [];

    try {
      if (isWindows) {
        const output = execSync('tasklist /FO CSV /NH', {
          encoding: 'utf-8',
          timeout: 5000,
          windowsHide: true,
        });
        for (const line of output.trim().split('\n')) {
          const parts = line.split('","');
          if (parts.length >= 2) {
            const name = parts[0].replace(/^"/, '');
            const pid = parseInt(parts[1].replace(/"$/, ''), 10);
            if (name && !isNaN(pid)) {
              processes.push({ name, pid });
            }
          }
        }
      } else {
        const output = execSync('ps -eo comm,pid', {
          encoding: 'utf-8',
          timeout: 5000,
        });
        for (const line of output.trim().split('\n').slice(1)) {
          const match = line.trim().match(/^(.+?)\s+(\d+)$/);
          if (match) {
            processes.push({ name: match[1], pid: parseInt(match[2], 10) });
          }
        }
      }
    } catch {
      // Command failed
    }

    return processes;
  }
}

export default AgentVerifier;
