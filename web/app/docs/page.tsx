'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH DOCUMENTATION PAGE
// Retro 70s Terminal Design
// ═══════════════════════════════════════════════════════════════

type SectionId = 'getting-started' | 'how-it-works' | 'features' | 'cli' | 'rules' | 'faq';

const sections: { id: SectionId; label: string }[] = [
  { id: 'getting-started', label: '[>] Getting Started' },
  { id: 'how-it-works', label: '[#] How It Works' },
  { id: 'features', label: '[+] Features' },
  { id: 'cli', label: '[/] CLI Reference' },
  { id: 'rules', label: '[~] Rules Reference' },
  { id: 'faq', label: '[?] FAQ' },
];

function CodeBlock({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="bg-scope-bg border border-scope-border mb-4 overflow-hidden">
      {title && (
        <div className="px-3 py-2 border-b border-scope-border text-scope-muted text-[10px] md:text-xs">
          {title}
        </div>
      )}
      <pre className="p-3 text-scope-amber text-[10px] md:text-xs leading-relaxed overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}

function StatusBadge({ status, variant }: { status: string; variant: 'success' | 'muted' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs border ${
      variant === 'success'
        ? 'border-scope-mint text-scope-mint'
        : 'border-scope-muted text-scope-muted'
    }`}>
      {status}
    </span>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('getting-started');
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div>
            <h2 className="text-scope-amber text-lg mb-4">┌─ Getting Started ─┐</h2>

            <p className="text-scope-text leading-relaxed mb-6">
              AgentLeash monitors and controls what files and resources AI coding agents
              access in your projects. See exactly what your agent touched, set boundaries
              on what it can reach, and maintain full visibility over automated changes.
            </p>

            <h3 className="text-scope-rust mb-3">The Problem</h3>

            <p className="text-scope-text leading-relaxed mb-4">
              AI coding agents like Claude Code and Cursor are powerful, but they operate
              with broad access to your codebase. Without visibility:
            </p>

            <div className="bg-scope-bg-light border border-scope-coral p-4 mb-6">
              <div className="text-scope-coral mb-3"><span className="mr-2">[!]</span> You don't know which files the agent actually read</div>
              <div className="text-scope-coral mb-3"><span className="mr-2">[!]</span> Sensitive files might be accessed unintentionally</div>
              <div className="text-scope-coral mb-3"><span className="mr-2">[!]</span> No audit trail for compliance or debugging</div>
              <div className="text-scope-coral"><span className="mr-2">[!]</span> Agents might modify files outside intended scope</div>
            </div>

            <h3 className="text-scope-rust mb-3">The Solution</h3>

            <div className="bg-scope-bg-light border border-scope-border p-4 mb-6">
              <div className="text-scope-text mb-3"><span className="text-scope-amber">[1]</span> Initialize AgentLeash in your project</div>
              <div className="text-scope-text mb-3"><span className="text-scope-amber">[2]</span> Define scope rules (allow, deny, warn)</div>
              <div className="text-scope-text mb-3"><span className="text-scope-amber">[3]</span> Run your AI agent session through AgentLeash</div>
              <div className="text-scope-text mb-3"><span className="text-scope-amber">[4]</span> Review the access log after the session</div>
              <div className="text-scope-text"><span className="text-scope-amber">[5]</span> Refine rules based on actual behavior</div>
            </div>

            <h3 className="text-scope-rust mb-3">Quick Start</h3>

            <CodeBlock title="terminal">
{`# Install the CLI
$ npm install -g agentleash

# Initialize in your project
$ cd your-project
$ leash init
[/] Created .agentleash/config.yaml
[/] Created .agentleash/rules.yaml

# Start a monitored session
$ leash watch --agent claude-code
[/] Monitoring started
[/] Watching: /Users/you/your-project
[/] Rules loaded: 12 allow, 3 deny, 2 warn

# ... run your AI agent normally ...

# View the access report
$ leash report
[/] Session complete: 47 files accessed
[/] 3 warnings triggered
[/] Full report: .agentleash/reports/2026-01-28_14-32.json`}
            </CodeBlock>

            <h3 className="text-scope-rust mb-3">Supported AI Agents</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {[
                { name: 'Claude Code', id: 'claude-code', supported: true },
                { name: 'Cursor', id: 'cursor', supported: true },
                { name: 'Windsurf', id: 'windsurf', supported: true },
                { name: 'GitHub Copilot', id: 'github-copilot', supported: true },
                { name: 'Aider', id: 'aider', supported: true },
                { name: 'Continue', id: 'continue', supported: true },
              ].map(agent => (
                <div key={agent.name} className="bg-scope-bg-light border border-scope-border p-2 md:p-3 flex justify-between items-center">
                  <span className="text-scope-text text-xs md:text-sm">{agent.name}</span>
                  <StatusBadge
                    status={agent.supported ? 'Supported' : 'Coming Soon'}
                    variant={agent.supported ? 'success' : 'muted'}
                  />
                </div>
              ))}
            </div>

            <h3 className="text-scope-rust mb-3">Agent Setup</h3>

            <p className="text-scope-text leading-relaxed mb-4">
              Start a monitored session by passing the agent name with the <code className="text-scope-amber">--agent</code> flag:
            </p>

            <CodeBlock title="per-agent setup">
{`# Claude Code
$ leash watch --agent claude-code

# Cursor
$ leash watch --agent cursor

# Windsurf
$ leash watch --agent windsurf

# Aider
$ leash watch --agent aider

# GitHub Copilot
$ leash watch --agent github-copilot

# Continue
$ leash watch --agent continue`}
            </CodeBlock>

            <div className="bg-scope-bg-light border border-scope-amber p-4">
              <div className="text-scope-amber mb-2">[i] Works with any file-accessing agent</div>
              <div className="text-scope-muted text-xs leading-relaxed">
                AgentLeash monitors at the filesystem level. Any tool that reads or writes
                files in your project directory will be tracked, regardless of native integration.
                The <code className="text-scope-amber">--agent</code> flag labels the session for filtering in logs and reports.
              </div>
            </div>
          </div>
        );

      case 'how-it-works':
        return (
          <div>
            <h2 className="text-scope-amber text-lg mb-4">┌─ How It Works ─┐</h2>

            <p className="text-scope-text leading-relaxed mb-6">
              AgentLeash uses filesystem monitoring to track all file access within your
              project directory. It operates transparently alongside your AI agent, logging
              every read and write operation.
            </p>

            <h3 className="text-scope-rust mb-3">Architecture</h3>

            <CodeBlock title="monitoring flow">
{`┌─────────────────────────────────────────────────────────────────┐
│                        YOUR PROJECT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────┐      ┌───────────────┐                     │
│   │   AI Agent    │      │  AgentLeash   │                     │
│   │ (Claude Code) │      │    Monitor    │                     │
│   └───────┬───────┘      └───────┬───────┘                     │
│           │                      │                              │
│           │  read/write          │  observe                     │
│           │                      │                              │
│           ▼                      ▼                              │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    FILESYSTEM                           │  │
│   │  src/  │  .env  │  config/  │  node_modules/  │  ...   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │   Rules Engine  │                         │
│                    │  allow / deny   │                         │
│                    │  warn / audit   │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │   Access Log    │                         │
│                    │  .agentleash/   │                         │
│                    └─────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`}
            </CodeBlock>

            <h3 className="text-scope-rust mb-3">Monitoring Modes</h3>

            <div className="mb-6">
              <h4 className="text-scope-amber mb-2">Passive Mode (Default)</h4>
              <p className="text-scope-text leading-relaxed mb-3">
                Observes and logs all file access without blocking any operations.
                The agent runs normally while AgentLeash records everything for
                later review. Ideal for understanding agent behavior.
              </p>
              <CodeBlock>
{`$ leash watch --mode passive
[/] Passive monitoring: logging only, no blocking`}
              </CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="text-scope-amber mb-2">Active Mode</h4>
              <p className="text-scope-text leading-relaxed mb-3">
                Enforces your rules in real-time. Denied file access is blocked,
                and the agent receives a permission error. Use this when you've
                established trusted rules and want to enforce boundaries.
              </p>
              <CodeBlock>
{`$ leash watch --mode active
[/] Active monitoring: rules will be enforced
[!] Denied access will be blocked`}
              </CodeBlock>
            </div>

            <div className="mb-6">
              <h4 className="text-scope-amber mb-2">Interactive Mode</h4>
              <p className="text-scope-text leading-relaxed mb-3">
                Prompts you for approval when the agent tries to access files
                matching "warn" rules. Useful when working with sensitive areas
                of the codebase where you want human oversight.
              </p>
              <CodeBlock>
{`$ leash watch --mode interactive
[/] Interactive monitoring: will prompt on warnings

[?] Agent wants to READ: config/production.yaml
    Allow this access? [y/n/always/never]: _`}
              </CodeBlock>
            </div>

            <h3 className="text-scope-rust mb-3">What Gets Logged</h3>

            <div className="bg-scope-bg-light border border-scope-border p-4">
              <div className="text-scope-text mb-2"><span className="text-scope-mint">[/]</span> File path (relative to project root)</div>
              <div className="text-scope-text mb-2"><span className="text-scope-mint">[/]</span> Operation type (read, write, delete, rename)</div>
              <div className="text-scope-text mb-2"><span className="text-scope-mint">[/]</span> Timestamp (millisecond precision)</div>
              <div className="text-scope-text mb-2"><span className="text-scope-mint">[/]</span> Rule matched (if any)</div>
              <div className="text-scope-text mb-2"><span className="text-scope-mint">[/]</span> Action taken (allow, deny, warn)</div>
              <div className="text-scope-text"><span className="text-scope-mint">[/]</span> Session context (agent name, duration)</div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div>
            <h2 className="text-scope-amber text-lg mb-4">┌─ Features ─┐</h2>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">[&gt;] Real-Time Monitoring</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Watch file access as it happens. The CLI displays a live feed of
                every file your agent touches, color-coded by rule match.
              </p>
              <CodeBlock>
{`$ leash watch --live
[/] 14:32:01  READ   src/index.ts
[/] 14:32:01  READ   src/utils/helpers.ts
[/] 14:32:02  READ   package.json
[!] 14:32:03  READ   .env.local          [WARN: sensitive]
[/] 14:32:04  WRITE  src/components/Button.tsx
[X] 14:32:05  READ   config/secrets.yaml [DENIED: blocked]`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">[&gt;] Flexible Rules Engine</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Define rules using glob patterns, regex, or directory paths.
                Rules can allow, deny, or warn on specific file access patterns.
              </p>
              <CodeBlock title=".agentleash/rules.yaml">
{`# Allow all source files
- pattern: "src/**/*"
  action: allow

# Warn on environment files
- pattern: "*.env*"
  action: warn
  reason: "sensitive configuration"

# Block secrets directory
- pattern: "secrets/**"
  action: deny
  reason: "contains credentials"

# Allow package files (read-only)
- pattern: "package*.json"
  action: allow
  operations: [read]`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">[&gt;] Session Reports</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                After each session, generate a comprehensive report showing
                every file accessed, organized by operation type and rule match.
              </p>
              <CodeBlock>
{`$ leash report --format summary

SESSION REPORT: 2026-01-28 14:32:01 - 14:47:22
Agent: claude-code
Duration: 15m 21s

FILES ACCESSED: 47
├── Read:    38
├── Write:   8
└── Delete:  1

BY RULE:
├── Allowed: 42
├── Warned:  3
└── Denied:  2

WARNINGS:
├── .env.local (read) - sensitive configuration
├── config/prod.yaml (read) - production config
└── .env.local (read) - sensitive configuration

DENIED:
├── secrets/api-keys.yaml - contains credentials
└── secrets/database.yaml - contains credentials`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3 flex items-center gap-2">
                [&gt;] Team Policies
                <span className="bg-scope-rust text-scope-bg text-xs px-2 py-0.5">TEAM</span>
              </h3>
              <p className="text-scope-text leading-relaxed">
                Share scope rules across your team. Define organization-wide
                policies that apply to all projects.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3 flex items-center gap-2">
                [&gt;] Audit Export
                <span className="bg-scope-rust text-scope-bg text-xs px-2 py-0.5">TEAM</span>
              </h3>
              <p className="text-scope-text leading-relaxed">
                Export access logs for compliance. Supports JSON, CSV, and
                SIEM-compatible formats for security auditing.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3 flex items-center gap-2">
                [&gt;] Webhooks
                <span className="bg-scope-coral text-scope-bg text-xs px-2 py-0.5">ENTERPRISE</span>
              </h3>
              <p className="text-scope-text leading-relaxed">
                Receive real-time notifications when rules are triggered.
                Integrate with Slack, PagerDuty, or custom endpoints.
              </p>
            </div>
          </div>
        );

      case 'cli':
        return (
          <div>
            <h2 className="text-scope-amber text-lg mb-4">┌─ CLI Reference ─┐</h2>

            <p className="text-scope-muted mb-6">
              Complete reference for the AgentLeash command-line interface.
            </p>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">leash init</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Initialize AgentLeash in the current directory.
              </p>
              <CodeBlock>
{`$ leash init [options]

Options:
  --template <name>   Use a preset rule template
                      (node, python, rust, minimal)
  --force             Overwrite existing configuration

Examples:
  $ leash init
  $ leash init --template node
  $ leash init --force`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">leash watch</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Start monitoring file access in the current project.
              </p>
              <CodeBlock>
{`$ leash watch [options]

Options:
  --agent <name>      Label for the agent being monitored
                      (default: "unknown")
  --mode <mode>       Monitoring mode: passive, active, interactive
                      (default: "passive")
  --live              Show real-time file access feed
  --quiet             Suppress output, log to file only
  --duration <time>   Auto-stop after duration (e.g., "1h", "30m")

Examples:
  $ leash watch --agent claude-code
  $ leash watch --mode active --live
  $ leash watch --agent cursor --duration 2h`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">leash stop</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Stop the current monitoring session.
              </p>
              <CodeBlock>
{`$ leash stop

[/] Session stopped
[/] Duration: 15m 21s
[/] Files accessed: 47
[/] Report saved: .agentleash/reports/2026-01-28_14-32.json`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">leash report</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Generate or view session reports.
              </p>
              <CodeBlock>
{`$ leash report [options]

Options:
  --session <id>      Report for specific session
                      (default: "latest")
  --format <format>   Output format: summary, detailed, json, csv
                      (default: "summary")
  --output <file>     Write report to file
  --warnings          Show only warnings and denials
  --files             Show only file list

Examples:
  $ leash report
  $ leash report --format json --output report.json
  $ leash report --session 2026-01-28_14-32 --warnings`}
              </CodeBlock>
            </div>

            <div className="mb-8">
              <h3 className="text-scope-rust mb-3">leash rules</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Manage scope rules.
              </p>
              <CodeBlock>
{`$ leash rules <command> [options]

Commands:
  list                Show all active rules
  add                 Add a new rule interactively
  test <path>         Test which rule matches a path
  validate            Check rules.yaml for errors

Examples:
  $ leash rules list
  $ leash rules add
  $ leash rules test src/utils/secret.ts
  $ leash rules validate`}
              </CodeBlock>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div>
            <h2 className="text-scope-amber text-lg mb-4">┌─ Rules Reference ─┐</h2>

            <p className="text-scope-text leading-relaxed mb-6">
              Rules control how AgentLeash responds to file access. Rules are
              defined in <code className="text-scope-amber">.agentleash/rules.yaml</code> and
              evaluated in order from top to bottom.
            </p>

            <h3 className="text-scope-rust mb-3">Rule Structure</h3>

            <CodeBlock title="rule anatomy">
{`- pattern: "src/**/*.ts"      # Required: glob pattern to match
  action: allow               # Required: allow, deny, or warn
  operations: [read, write]   # Optional: limit to specific operations
  reason: "source files"      # Optional: logged when rule matches`}
            </CodeBlock>

            <h3 className="text-scope-rust mb-3">Actions</h3>

            <div className="space-y-3 mb-6">
              <div className="bg-scope-bg-light border border-scope-mint p-4">
                <div className="text-scope-mint font-bold mb-2">allow</div>
                <p className="text-scope-text text-sm">
                  Permits the file access. The operation proceeds normally and is logged
                  for reporting purposes.
                </p>
              </div>

              <div className="bg-scope-bg-light border border-scope-coral p-4">
                <div className="text-scope-coral font-bold mb-2">deny</div>
                <p className="text-scope-text text-sm">
                  Blocks the file access (in active mode). In passive mode, logs the
                  access as denied but allows it to proceed.
                </p>
              </div>

              <div className="bg-scope-bg-light border border-scope-amber p-4">
                <div className="text-scope-amber font-bold mb-2">warn</div>
                <p className="text-scope-text text-sm">
                  Allows the access but flags it for review. In interactive mode,
                  prompts for confirmation before proceeding.
                </p>
              </div>
            </div>

            <h3 className="text-scope-rust mb-3">Pattern Syntax</h3>

            <CodeBlock title="glob patterns">
{`# Match specific file
"package.json"

# Match file extension
"*.ts"
"*.{ts,tsx}"

# Match directory and all contents
"src/**/*"

# Match any depth
"**/test/**"

# Match single directory level
"config/*"

# Negation (exclude from previous matches)
"!src/**/*.test.ts"

# Regex (prefix with ~)
"~.*\\.secret\\..*"`}
            </CodeBlock>

            <h3 className="text-scope-rust mb-3">Example: Node.js Project</h3>

            <CodeBlock title=".agentleash/rules.yaml">
{`# Allow source files
- pattern: "src/**/*"
  action: allow

# Allow config files (read-only)
- pattern: "*.config.{js,ts,json}"
  action: allow
  operations: [read]

# Warn on environment files
- pattern: ".env*"
  action: warn
  reason: "environment configuration"

# Deny node_modules writes
- pattern: "node_modules/**"
  action: deny
  operations: [write, delete]
  reason: "package integrity"

# Deny git internals
- pattern: ".git/**"
  action: deny
  reason: "git internals"`}
            </CodeBlock>
          </div>
        );

      case 'faq':
        return (
          <div>
            <h2 className="text-scope-amber text-lg mb-4">┌─ FAQ ─┐</h2>

            <div className="mb-6">
              <h3 className="text-scope-rust mb-2">[?] Does AgentLeash slow down my AI agent?</h3>
              <p className="text-scope-text leading-relaxed">
                No. AgentLeash uses non-blocking filesystem monitoring. The overhead
                is typically less than 1ms per file operation — imperceptible during
                normal use.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-scope-rust mb-2">[?] Can I use AgentLeash with multiple agents simultaneously?</h3>
              <p className="text-scope-text leading-relaxed mb-3">
                Yes. Each watch session is labeled with the agent name, and all
                activity is logged separately. You can review reports filtered
                by agent.
              </p>
              <CodeBlock>
{`# Terminal 1
$ leash watch --agent claude-code

# Terminal 2 (different project)
$ leash watch --agent cursor`}
              </CodeBlock>
            </div>

            <div className="mb-6">
              <h3 className="text-scope-rust mb-2">[?] What happens if I forget to stop monitoring?</h3>
              <p className="text-scope-text leading-relaxed">
                AgentLeash continues logging until explicitly stopped. You can set
                a maximum duration with <code className="text-scope-amber">--duration</code> to
                auto-stop after a time limit. Sessions are also cleanly terminated
                if your terminal closes.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-scope-rust mb-2">[?] Does AgentLeash work with remote filesystems?</h3>
              <p className="text-scope-text leading-relaxed">
                AgentLeash monitors the local filesystem. For remote development
                (SSH, containers, WSL), install AgentLeash in the remote environment
                where the files actually live.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-scope-rust mb-2">[?] How do I share rules with my team?</h3>
              <p className="text-scope-text leading-relaxed">
                Commit the <code className="text-scope-amber">.agentleash/</code> directory to your
                repository. Rules will be shared with anyone who clones the project.
                Team tier users can also sync rules across multiple projects.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-scope-rust mb-2">[?] Is AgentLeash open source?</h3>
              <p className="text-scope-text leading-relaxed">
                The CLI is open source and available on GitHub. You can audit the
                monitoring implementation yourself. Team and Enterprise features
                require a subscription.
              </p>
            </div>

            <div className="bg-scope-bg-light border border-scope-border p-4 mt-8">
              <div className="text-scope-muted mb-2">Still have questions?</div>
              <div className="text-scope-text">
                Contact us at <span className="text-scope-amber">support@agentleash.io</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-mono text-sm">
      {/* Header */}
      <header className="border-b border-scope-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-scope-amber text-base md:text-lg">AGENTLEASH</span>
                <span className="text-scope-amber animate-cursor-blink">_</span>
              </Link>
              <span className="hidden md:inline text-scope-border">|</span>
              <span className="hidden md:inline text-scope-muted">Documentation</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: 'HOME', href: '/' },
                { label: 'DOCS', href: '/docs', active: true },
                { label: 'PRICING', href: '/pricing' },
                { label: 'GITHUB', href: 'https://github.com/skygkruger' },
                { label: '@', href: 'https://x.com/run_veridian' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative transition-colors duration-200 ${
                    item.active ? 'text-scope-amber' : 'text-scope-muted hover:text-scope-amber'
                  }`}
                  onMouseEnter={() => setHoveredNav(item.label)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <span className={`transition-all duration-200 ${hoveredNav === item.label && !item.active ? 'pl-4' : ''}`}>
                    {hoveredNav === item.label && !item.active && <span className="absolute left-0 text-scope-amber">&gt;</span>}
                    [{item.label}]
                  </span>
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-scope-amber"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? '[X]' : '[=]'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Section Selector */}
      <div className="md:hidden border-b border-scope-border p-4 bg-scope-bg-light">
        <div className="text-scope-muted text-xs mb-2 tracking-wider">SECTION</div>
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`text-xs px-2 py-1 border transition-colors ${
                activeSection === section.id
                  ? 'border-scope-amber text-scope-amber'
                  : 'border-scope-border text-scope-muted'
              }`}
            >
              {section.label.replace(/\[\S\] /, '')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex max-w-6xl mx-auto">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden md:block w-64 border-r border-scope-border p-6 min-h-[calc(100vh-60px)]">
          {/* Mini Logo */}
          <pre className="text-scope-amber text-[6px] leading-tight mb-6">
{`██╗     ███████╗ █████╗ ███████╗██╗  ██╗
██║     ██╔════╝██╔══██╗██╔════╝██║  ██║
██║     █████╗  ███████║███████╗███████║
██║     ██╔══╝  ██╔══██║╚════██║██╔══██║
███████╗███████╗██║  ██║███████║██║  ██║
╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`}
          </pre>
          <pre className="text-scope-amber text-[6px] leading-tight mb-6">
{`┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
└───┘ └───┘ └───┘ └───┘ └───┘`}
          </pre>

          <div className="text-scope-muted text-xs mb-4 tracking-wider">DOCUMENTATION</div>

          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`block w-full text-left px-3 py-2 mb-1 text-sm transition-colors duration-200 ${
                activeSection === section.id
                  ? 'bg-scope-bg-light border border-scope-amber text-scope-amber'
                  : 'border border-transparent text-scope-text hover:text-scope-amber'
              }`}
            >
              {section.label}
            </button>
          ))}

          <div className="mt-8 p-4 bg-scope-bg-light border border-scope-border">
            <div className="text-scope-amber text-xs mb-2">[i] Full Visibility</div>
            <div className="text-scope-muted text-xs leading-relaxed">
              Know exactly what your AI agents access. No more wondering
              what files were read or modified.
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 max-w-3xl">
          {renderContent()}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-scope-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-scope-muted">
          <span>AgentLeash v1.0.0</span>
          <div className="flex flex-wrap gap-4">
            <a href="https://github.com/skygkruger" className="hover:text-scope-amber transition-colors">[GITHUB]</a>
            <a href="mailto:sky@veridian.run" className="hover:text-scope-amber transition-colors">[CONTACT]</a>
            <a href="https://veridiantools.dev" className="hover:text-scope-amber transition-colors">[VERIDIAN]</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
