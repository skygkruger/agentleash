// ═══════════════════════════════════════════════════════════════
// AGENTLEASH SUPPORTED AGENTS
// Central agent configuration for cross-product compatibility
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  setupCommand: string;
}

// ───────────────────────────────────────────────────────────────
// AGENT DEFINITIONS
// IDs match VaultAgent for cross-product compatibility
// ───────────────────────────────────────────────────────────────

export const AGENTS: AgentConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic CLI agent for autonomous coding tasks',
    setupCommand: 'leash watch --agent claude-code',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor with integrated agent',
    setupCommand: 'leash watch --agent cursor',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    description: 'Codeium AI coding assistant and editor',
    setupCommand: 'leash watch --agent windsurf',
  },
  {
    id: 'aider',
    name: 'Aider',
    description: 'Terminal-based AI pair programming tool',
    setupCommand: 'leash watch --agent aider',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'GitHub AI coding assistant for VS Code and JetBrains',
    setupCommand: 'leash watch --agent github-copilot',
  },
  {
    id: 'continue',
    name: 'Continue',
    description: 'Open-source AI code assistant for VS Code and JetBrains',
    setupCommand: 'leash watch --agent continue',
  },
];

// ───────────────────────────────────────────────────────────────
// CONVENIENCE EXPORTS
// ───────────────────────────────────────────────────────────────

export const AGENT_IDS = AGENTS.map((a) => a.id);

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function isKnownAgent(id: string): boolean {
  return AGENT_IDS.includes(id);
}
