// ═══════════════════════════════════════════════════════════════
// AGENTLEASH PERMISSION ENFORCER
// Restricts file permissions based on deny rules
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { EventEmitter } from 'events';
import { minimatch } from 'minimatch';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface EnforcerConfig {
  basePath: string;
  rules: Array<{
    path: string;
    deny?: string[];
  }>;
}

interface PermissionRecord {
  filePath: string;
  originalMode: number;
  restricted: boolean;
}

interface RecoveryData {
  pid: number;
  timestamp: string;
  records: Array<{
    filePath: string;
    originalMode: number;
  }>;
}

// ───────────────────────────────────────────────────────────────
// PERMISSION ENFORCER CLASS
// ───────────────────────────────────────────────────────────────

export class PermissionEnforcer extends EventEmitter {
  private basePath: string;
  private rules: EnforcerConfig['rules'];
  private permissionMap: Map<string, PermissionRecord> = new Map();
  private recoveryFilePath: string;
  private isWindows: boolean = process.platform === 'win32';

  constructor(config: EnforcerConfig) {
    super();
    this.basePath = path.resolve(config.basePath);
    this.rules = config.rules;
    this.recoveryFilePath = path.join(
      os.tmpdir(),
      `.agentleash-recovery-${process.pid}.json`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ACTIVATE
  // ─────────────────────────────────────────────────────────────

  async activate(): Promise<void> {
    // Check for stale recovery files from crashed processes
    await this.recoverStalePermissions();

    // Scan for files matching deny rules
    const filesToRestrict = this.findDeniedFiles();

    for (const filePath of filesToRestrict) {
      this.restrictFile(filePath);
    }

    // Write recovery file
    this.writeRecoveryFile();

    // Install signal handlers for crash recovery
    const cleanup = () => {
      this.deactivate();
    };
    process.on('exit', cleanup);
    process.on('uncaughtException', (err) => {
      console.error('[PermissionEnforcer] Uncaught exception, restoring permissions:', err.message);
      this.deactivateSync();
      process.exit(1);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DEACTIVATE
  // ─────────────────────────────────────────────────────────────

  async deactivate(): Promise<void> {
    this.deactivateSync();
  }

  private deactivateSync(): void {
    for (const [filePath, record] of this.permissionMap) {
      if (record.restricted) {
        this.restoreFile(filePath);
      }
    }
    this.permissionMap.clear();
    this.deleteRecoveryFile();
    this.emit('restored');
  }

  // ─────────────────────────────────────────────────────────────
  // RESTRICT / RESTORE FILES
  // ─────────────────────────────────────────────────────────────

  restrictFile(filePath: string): void {
    try {
      const stat = fs.statSync(filePath);
      const originalMode = stat.mode;

      if (this.isWindows) {
        try {
          execSync(`icacls "${filePath}" /deny %USERNAME%:(R,W)`, {
            windowsHide: true,
            stdio: 'ignore',
          });
        } catch {
          // icacls may fail on some paths
          return;
        }
      } else {
        // Remove read/write permissions
        const newMode = originalMode & ~0o666; // Remove rw for user/group/other
        fs.chmodSync(filePath, newMode);
      }

      this.permissionMap.set(filePath, {
        filePath,
        originalMode,
        restricted: true,
      });
    } catch {
      // File may not exist or not be accessible
    }
  }

  restoreFile(filePath: string): void {
    const record = this.permissionMap.get(filePath);
    if (!record) return;

    try {
      if (this.isWindows) {
        try {
          execSync(`icacls "${filePath}" /remove:d %USERNAME%`, {
            windowsHide: true,
            stdio: 'ignore',
          });
        } catch {
          // icacls may fail
        }
      } else {
        fs.chmodSync(filePath, record.originalMode);
      }

      record.restricted = false;
    } catch {
      // File may not exist anymore
    }
  }

  // ─────────────────────────────────────────────────────────────
  // NEW FILE HANDLER
  // ─────────────────────────────────────────────────────────────

  onNewFileDetected(filePath: string): void {
    const relativePath = path.relative(this.basePath, filePath).replace(/\\/g, '/');
    if (this.matchesDenyRule(relativePath)) {
      this.restrictFile(filePath);
      this.writeRecoveryFile();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RULE MATCHING
  // ─────────────────────────────────────────────────────────────

  private matchesDenyRule(relativePath: string): boolean {
    for (const rule of this.rules) {
      if (rule.deny && rule.deny.length > 0) {
        if (minimatch(relativePath, rule.path, { dot: true, matchBase: true })) {
          return true;
        }
      }
    }
    return false;
  }

  private findDeniedFiles(): string[] {
    const denied: string[] = [];
    this.walkDir(this.basePath, (filePath) => {
      const relativePath = path.relative(this.basePath, filePath).replace(/\\/g, '/');
      if (this.matchesDenyRule(relativePath)) {
        denied.push(filePath);
      }
    });
    return denied;
  }

  private walkDir(dir: string, callback: (filePath: string) => void): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip common ignored dirs
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        continue;
      }

      if (entry.isFile()) {
        callback(fullPath);
      } else if (entry.isDirectory()) {
        this.walkDir(fullPath, callback);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CRASH RECOVERY
  // ─────────────────────────────────────────────────────────────

  private async recoverStalePermissions(): Promise<void> {
    const tmpDir = os.tmpdir();
    let files: string[];
    try {
      files = fs.readdirSync(tmpDir).filter(
        (f) => f.startsWith('.agentleash-recovery-') && f.endsWith('.json')
      );
    } catch {
      return;
    }

    for (const file of files) {
      const filePath = path.join(tmpDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: RecoveryData = JSON.parse(content);

        // Skip our own recovery file
        if (data.pid === process.pid) continue;

        // Restore permissions
        for (const record of data.records) {
          try {
            if (this.isWindows) {
              execSync(`icacls "${record.filePath}" /remove:d %USERNAME%`, {
                windowsHide: true,
                stdio: 'ignore',
              });
            } else {
              fs.chmodSync(record.filePath, record.originalMode);
            }
          } catch {
            // File may not exist
          }
        }

        // Delete stale recovery file
        fs.unlinkSync(filePath);
      } catch {
        // Corrupted recovery file, delete it
        try { fs.unlinkSync(filePath); } catch { /* noop */ }
      }
    }
  }

  private writeRecoveryFile(): void {
    const data: RecoveryData = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      records: Array.from(this.permissionMap.values())
        .filter((r) => r.restricted)
        .map((r) => ({
          filePath: r.filePath,
          originalMode: r.originalMode,
        })),
    };

    try {
      fs.writeFileSync(this.recoveryFilePath, JSON.stringify(data, null, 2));
    } catch {
      // Can't write recovery file — non-fatal
    }
  }

  private deleteRecoveryFile(): void {
    try {
      if (fs.existsSync(this.recoveryFilePath)) {
        fs.unlinkSync(this.recoveryFilePath);
      }
    } catch {
      // Non-fatal
    }
  }
}

export default PermissionEnforcer;
