'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT LANDING PAGE
// Pastel Retro Terminal Design
// Primary Accent: Warm Amber (#d4a76a)
// ═══════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <div className="min-h-screen font-mono text-sm">
      {/* Header */}
      <header className="border-b border-scope-border">
        <div className="max-w-4xl mx-auto px-4">
          <pre className="text-xs py-2 text-scope-amber">
{`╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                                  [DOCS]  [PRICING]  [GITHUB]  [@]  ║
╚══════════════════════════════════════════════════════════════════════════════╝`}
          </pre>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* ASCII Logo */}
        <div className="text-center text-scope-amber">
          <pre className="text-xs leading-tight inline-block">
{`
███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
`}
          </pre>
          <pre className="text-xs leading-tight inline-block mt-2">
{`         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘`}
          </pre>
          <p className="text-xs tracking-widest mt-4 text-scope-lavender">
            // AI AGENT PERMISSION CONTROLLER v1.0
          </p>
        </div>

        {/* Tagline */}
        <div className="text-center space-y-2">
          <p className="text-scope-text text-lg">
            AI agents are powerful. ScopeAgent keeps them in line.
          </p>
          <p className="text-xs text-scope-muted">
            // path boundaries, real-time monitoring, violation alerts
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <button className="border border-scope-amber text-scope-amber px-6 py-2 hover:bg-scope-amber hover:text-scope-bg transition-colors">
            [GET STARTED FREE]
          </button>
          <button className="border border-scope-border text-scope-muted px-6 py-2 hover:border-scope-amber hover:text-scope-amber transition-colors">
            [VIEW DEMO]
          </button>
        </div>

        {/* Problem Statement */}
        <div className="space-y-4">
          <p className="text-xs text-scope-muted">// THE PROBLEM</p>
          <pre className="text-xs leading-relaxed text-scope-text">
{`You use Claude Code, Cursor, or Copilot to write code faster.
But have you ever wondered:

  [?] What files is the agent actually reading?
  [?] Did it just try to access my .env?
  [?] Can it see my SSH keys?
  [?] What if it goes rogue and deletes things?

You don't know. You can't see. That's terrifying.`}
          </pre>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <p className="text-xs text-scope-muted">// THE SOLUTION</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-scope-amber">
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [#] PATH BOUNDARIES    │
│                           │
│  Define exactly what      │
│  AI agents can access.    │
│  Glob patterns, deny      │
│  lists, fine control.     │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
            <div className="text-scope-lavender">
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [>] REAL-TIME VIEW     │
│                           │
│  See every file           │
│  operation as it          │
│  happens. Full            │
│  visibility.              │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
            <div className="text-scope-cyan">
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [!] ALERTS             │
│                           │
│  Get notified when        │
│  agents try to            │
│  access sensitive         │
│  files or paths.          │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="space-y-4">
          <p className="text-xs text-scope-muted">// HOW IT WORKS</p>
          <pre className="text-xs leading-tight text-scope-text">
{`┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   1. DEFINE         2. WATCH           3. PROTECT                   │
│   ───────────       ───────────        ───────────                  │
│                                                                     │
│   Create your       Start the          Get alerts                   │
│   .scopeagent.yml   daemon with        when agents                  │
│   with path rules   one command        cross the line               │
│                                                                     │
│   $ scopeagent      $ scopeagent       [!] VIOLATION                │
│     init              watch            .env access blocked          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>

        {/* Demo */}
        <div className="space-y-4">
          <p className="text-xs text-scope-muted">// LIVE PREVIEW</p>
          <pre className="text-xs leading-tight">
{`╔══════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                                          `}<span className="text-scope-mint">[WATCHING...]</span>{`   ║
╠══════════════════════════════════════════════════════════════════════╣
║  Scope: my-project-scope                                             ║
║  Path:  /Users/dev/projects/myapp                                    ║
║  Rules: 15 active                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  RECENT ACTIVITY                                                     ║
║  ───────────────────────────────────────────────────────────────     ║
║  14:32:01  `}<span className="text-scope-mint">[/]</span>{`  READ   src/components/Button.tsx                     ║
║  14:32:02  `}<span className="text-scope-mint">[/]</span>{`  WRITE  src/components/Button.tsx                     ║
║  14:32:05  `}<span className="text-scope-coral">[X]</span>{`  READ   .env.local                    `}<span className="text-scope-coral">[BLOCKED]</span>{`       ║
║  14:32:08  `}<span className="text-scope-mint">[/]</span>{`  READ   package.json                                  ║
║  14:32:10  `}<span className="text-scope-cream">[!]</span>{`  DELETE node_modules/lodash/...       `}<span className="text-scope-cream">[WARNING]</span>{`       ║
╚══════════════════════════════════════════════════════════════════════╝`}
          </pre>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <p className="text-xs text-scope-muted">// PRICING</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <pre className="text-xs leading-tight text-scope-text">
{`┌──────────────────┐
│                  │
│       FREE       │
│       $0/mo      │
│                  │
│  [/] 1 scope     │
│  [/] 1k logs/day │
│  [/] Basic       │
│                  │
│  [GET STARTED]   │
│                  │
└──────────────────┘`}
            </pre>
            <pre className="text-xs leading-tight text-scope-amber">
{`╔══════════════════╗
║                  ║
║       PRO        ║
║       $15/mo     ║
║                  ║
║  [/] 5 scopes    ║
║  [/] 10k logs    ║
║  [/] Custom      ║
║  [/] Export      ║
║                  ║
║  [UPGRADE]       ║
║                  ║
╚══════════════════╝`}
            </pre>
            <pre className="text-xs leading-tight text-scope-lavender">
{`┌──────────────────┐
│                  │
│       TEAM       │
│       $49/mo     │
│                  │
│  [/] 20 scopes   │
│  [/] 100k logs   │
│  [/] Sharing     │
│  [/] Webhooks    │
│                  │
│  [CONTACT]       │
│                  │
└──────────────────┘`}
            </pre>
            <pre className="text-xs leading-tight text-scope-text">
{`┌──────────────────┐
│                  │
│    ENTERPRISE    │
│    $149/mo       │
│                  │
│  [/] Unlimited   │
│  [/] SSO/SAML    │
│  [/] Compliance  │
│  [/] Dedicated   │
│                  │
│  [CONTACT]       │
│                  │
└──────────────────┘`}
            </pre>
          </div>
        </div>

        {/* Quick Start */}
        <div className="space-y-4">
          <p className="text-xs text-scope-muted">// QUICK START</p>
          <pre className="text-xs leading-tight text-scope-text bg-scope-bg-light p-4 border border-scope-border">
{`$ npm install -g @veridian/scopeagent

$ cd your-project
$ scopeagent init
[+] Created .scopeagent.yml

$ scopeagent watch
[*] Watching /Users/dev/projects/myapp
[*] 15 rules active
[*] Ready...`}
          </pre>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-scope-border mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <pre className="text-xs text-center text-scope-muted">
{`
═══════════════════════════════════════════════════════════════════════════════

                        KEEPING AI AGENTS IN CHECK

                             (c) 2025 SCOPEAGENT

            [HOME]  [DOCS]  [PRICING]  [GITHUB]  [TWITTER]  [CONTACT]

                        Part of the Veridian family

═══════════════════════════════════════════════════════════════════════════════
`}
          </pre>
        </div>
      </footer>
    </div>
  );
}
