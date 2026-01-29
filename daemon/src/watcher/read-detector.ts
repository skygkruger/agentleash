// ═══════════════════════════════════════════════════════════════
// AGENTLEASH READ DETECTOR
// Detects file reads via atime polling
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { minimatch } from 'minimatch';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface ReadDetectorConfig {
  basePath: string;
  pollIntervalMs?: number;
  ignored?: string[];
}

export interface ReadEvent {
  filePath: string;
  absolutePath: string;
  detectedAt: Date;
}

interface FileSnapshot {
  atime: number;
  mtime: number;
}

// ───────────────────────────────────────────────────────────────
// READ DETECTOR CLASS
// ───────────────────────────────────────────────────────────────

export class ReadDetector extends EventEmitter {
  private basePath: string;
  private pollIntervalMs: number;
  private ignored: string[];
  private snapshots: Map<string, FileSnapshot> = new Map();
  private pollTimer: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private atimeSupported: boolean = true;

  constructor(config: ReadDetectorConfig) {
    super();
    this.basePath = path.resolve(config.basePath);
    this.pollIntervalMs = config.pollIntervalMs ?? 2000;
    this.ignored = config.ignored ?? [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // START / STOP
  // ─────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Probe atime support
    await this.probeAtimeSupport();

    // Initial scan
    await this.scanFiles();

    // Start polling
    this.pollTimer = setInterval(async () => {
      if (this.running) {
        await this.poll();
      }
    }, this.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.snapshots.clear();
  }

  // ─────────────────────────────────────────────────────────────
  // ATIME PROBE
  // ─────────────────────────────────────────────────────────────

  private async probeAtimeSupport(): Promise<void> {
    try {
      // Find any file to test
      const files = this.enumerateFiles(this.basePath, 1);
      if (files.length === 0) return;

      const testFile = files[0];
      const statBefore = fs.statSync(testFile);
      const atimeBefore = statBefore.atimeMs;

      // Read the file
      const fd = fs.openSync(testFile, 'r');
      const buf = Buffer.alloc(1);
      fs.readSync(fd, buf, 0, 1, 0);
      fs.closeSync(fd);

      const statAfter = fs.statSync(testFile);
      const atimeAfter = statAfter.atimeMs;

      if (atimeBefore === atimeAfter) {
        this.atimeSupported = false;
        this.emit('warning', 'Read detection may be limited: filesystem atime updates appear disabled. On Windows, run: fsutil behavior set disablelastaccess 0');
      }
    } catch {
      // Probe failed, proceed anyway
    }
  }

  isAtimeSupported(): boolean {
    return this.atimeSupported;
  }

  // ─────────────────────────────────────────────────────────────
  // FILE SCANNING
  // ─────────────────────────────────────────────────────────────

  private async scanFiles(): Promise<void> {
    const files = this.enumerateFiles(this.basePath);
    for (const filePath of files) {
      try {
        const stat = fs.statSync(filePath);
        this.snapshots.set(filePath, {
          atime: stat.atimeMs,
          mtime: stat.mtimeMs,
        });
      } catch {
        // File may have been deleted, skip
      }
    }
  }

  private enumerateFiles(dir: string, maxFiles?: number): string[] {
    const files: string[] = [];
    try {
      this.walkDir(dir, files, maxFiles);
    } catch {
      // Permission errors, etc.
    }
    return files;
  }

  private walkDir(dir: string, files: string[], maxFiles?: number): void {
    if (maxFiles && files.length >= maxFiles) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (maxFiles && files.length >= maxFiles) return;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.basePath, fullPath).replace(/\\/g, '/');

      if (this.shouldIgnore(relativePath)) continue;

      if (entry.isFile()) {
        files.push(fullPath);
      } else if (entry.isDirectory()) {
        this.walkDir(fullPath, files, maxFiles);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // POLLING
  // ─────────────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    const currentFiles = this.enumerateFiles(this.basePath);
    const currentSet = new Set(currentFiles);

    // Check existing files
    for (const filePath of currentFiles) {
      try {
        const stat = fs.statSync(filePath);
        const prev = this.snapshots.get(filePath);

        if (!prev) {
          // New file — add to snapshot, no read event
          this.snapshots.set(filePath, {
            atime: stat.atimeMs,
            mtime: stat.mtimeMs,
          });
          continue;
        }

        const atimeChanged = stat.atimeMs !== prev.atime;
        const mtimeChanged = stat.mtimeMs !== prev.mtime;

        if (atimeChanged && !mtimeChanged) {
          // atime changed but mtime didn't → read detected
          const relativePath = path.relative(this.basePath, filePath).replace(/\\/g, '/');
          this.emit('read', {
            filePath: relativePath,
            absolutePath: filePath,
            detectedAt: new Date(),
          } as ReadEvent);
        }
        // If both changed → write (chokidar handles this)
        // Update snapshot
        this.snapshots.set(filePath, {
          atime: stat.atimeMs,
          mtime: stat.mtimeMs,
        });
      } catch {
        // File deleted between enumeration and stat — remove from snapshot
        this.snapshots.delete(filePath);
      }
    }

    // Remove deleted files from snapshot
    for (const filePath of this.snapshots.keys()) {
      if (!currentSet.has(filePath)) {
        this.snapshots.delete(filePath);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // IGNORE CHECK
  // ─────────────────────────────────────────────────────────────

  private shouldIgnore(relativePath: string): boolean {
    for (const pattern of this.ignored) {
      if (minimatch(relativePath, pattern, { dot: true })) {
        return true;
      }
    }
    return false;
  }
}

export default ReadDetector;
