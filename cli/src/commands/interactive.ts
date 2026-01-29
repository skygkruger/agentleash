// ═══════════════════════════════════════════════════════════════
// AGENTLEASH INTERACTIVE PROMPTER (CLI)
// Prompts for user approval on file access
// ═══════════════════════════════════════════════════════════════

import * as readline from 'readline';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export type PromptDecision = 'allow' | 'deny' | 'always' | 'never';

// ───────────────────────────────────────────────────────────────
// INTERACTIVE PROMPTER CLASS
// ───────────────────────────────────────────────────────────────

export class InteractivePrompter {
  private sessionMemory: Map<string, 'always' | 'never'> = new Map();
  private rl: readline.Interface | null = null;
  private promptQueue: Array<{
    filePath: string;
    operation: string;
    resolve: (decision: PromptDecision) => void;
  }> = [];
  private isPrompting: boolean = false;
  private timeoutMs: number;

  constructor(timeoutMs: number = 30000) {
    this.timeoutMs = timeoutMs;
    if (process.stdin.isTTY) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    }
  }

  async promptForAccess(filePath: string, operation: string): Promise<PromptDecision> {
    const memoryKey = filePath;
    const remembered = this.sessionMemory.get(memoryKey);
    if (remembered === 'always') return 'allow';
    if (remembered === 'never') return 'deny';

    if (!this.rl) {
      return 'deny';
    }

    return new Promise<PromptDecision>((resolve) => {
      this.promptQueue.push({ filePath, operation, resolve });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isPrompting || this.promptQueue.length === 0) return;
    this.isPrompting = true;

    const item = this.promptQueue.shift()!;
    const decision = await this.showPrompt(item.filePath, item.operation);

    if (decision === 'always' || decision === 'never') {
      this.sessionMemory.set(item.filePath, decision);
    }

    item.resolve(decision);
    this.isPrompting = false;

    if (this.promptQueue.length > 0) {
      this.processQueue();
    }
  }

  private showPrompt(filePath: string, operation: string): Promise<PromptDecision> {
    return new Promise<PromptDecision>((resolve) => {
      const opLabel = operation.toUpperCase();
      const question = `\n[?] Agent wants to ${opLabel}: ${filePath}\n    Allow? [y/n/a(lways)/ne(ver)]: `;

      const timer = setTimeout(() => {
        console.log('\n    [!] Prompt timed out — auto-denied');
        resolve('deny');
      }, this.timeoutMs);

      this.rl!.question(question, (answer) => {
        clearTimeout(timer);
        const input = answer.trim().toLowerCase();

        switch (input) {
          case 'y':
          case 'yes':
            resolve('allow');
            break;
          case 'a':
          case 'always':
            resolve('always');
            break;
          case 'ne':
          case 'never':
            resolve('never');
            break;
          case 'n':
          case 'no':
          default:
            resolve('deny');
            break;
        }
      });
    });
  }

  close(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    for (const item of this.promptQueue) {
      item.resolve('deny');
    }
    this.promptQueue = [];
  }
}

export default InteractivePrompter;
