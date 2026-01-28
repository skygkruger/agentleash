'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH LANDING PAGE
// Retro 70s Terminal Design - Veridian Style
// Primary Accent: Warm Gold (#d4a76a)
// ═══════════════════════════════════════════════════════════════

export default function HomePage() {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  return (
    <div className="min-h-screen font-mono text-sm">
      {/* Header - Veridian Style */}
      <header className="border-b border-scope-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-scope-amber text-lg tracking-tight">AGENTLEASH</span>
              <span className="text-scope-amber animate-cursor-blink">_</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {[
                { label: 'DOCS', href: '/docs' },
                { label: 'PRICING', href: '/pricing' },
                { label: 'GITHUB', href: 'https://github.com/veridiantools/agentleash' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative text-scope-muted hover:text-scope-amber transition-colors duration-200"
                  onMouseEnter={() => setHoveredNav(item.label)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <span className={`transition-all duration-200 ${hoveredNav === item.label ? 'pl-4' : ''}`}>
                    {hoveredNav === item.label && <span className="absolute left-0 text-scope-amber">&gt;</span>}
                    [{item.label}]
                  </span>
                </Link>
              ))}
              <Link
                href="/login"
                className="border border-scope-amber text-scope-amber px-4 py-1.5 hover:bg-scope-amber hover:text-scope-bg transition-all duration-200"
              >
                [LOGIN]
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          {/* ASCII Logo - LEASH */}
          <div className="mb-6">
            <pre className="text-scope-amber text-xs leading-tight inline-block">
{`██╗     ███████╗ █████╗ ███████╗██╗  ██╗
██║     ██╔════╝██╔══██╗██╔════╝██║  ██║
██║     █████╗  ███████║███████╗███████║
██║     ██╔══╝  ██╔══██║╚════██║██╔══██║
███████╗███████╗██║  ██║███████║██║  ██║
╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`}
            </pre>
          </div>

          {/* AGENT Nodes */}
          <div className="mb-6">
            <pre className="text-scope-amber text-xs leading-tight inline-block">
{`         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘`}
            </pre>
          </div>

          {/* Version Tag */}
          <p className="text-xs tracking-widest text-scope-rust mb-8">
            // AI AGENT ACCESS CONTROL v1.0
          </p>

          {/* Tagline */}
          <h1 className="text-xl text-scope-text mb-3">
            Know exactly what your AI agents access.
          </h1>
          <p className="text-scope-muted max-w-xl mx-auto mb-8">
            Monitor file operations in real-time. Define boundaries. Get alerts when agents cross the line.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="border border-scope-amber text-scope-amber px-6 py-2.5 hover:bg-scope-amber hover:text-scope-bg transition-all duration-200 group"
            >
              <span className="group-hover:pl-2 transition-all duration-200">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">&gt; </span>
                GET STARTED FREE
              </span>
            </Link>
            <Link
              href="/docs"
              className="border border-scope-border text-scope-muted px-6 py-2.5 hover:border-scope-rust hover:text-scope-rust transition-all duration-200"
            >
              VIEW DOCS
            </Link>
          </div>
        </section>

        {/* Problem Section */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// THE PROBLEM</p>
          <div className="bg-scope-bg-light border border-scope-border p-6">
            <pre className="text-sm leading-relaxed text-scope-text whitespace-pre-wrap">
{`You use Claude Code, Cursor, or Copilot to write code faster.
But have you ever wondered:

  `}<span className="text-scope-coral">[?]</span>{` What files is the agent actually reading?
  `}<span className="text-scope-coral">[?]</span>{` Did it just try to access my .env?
  `}<span className="text-scope-coral">[?]</span>{` Can it see my SSH keys or credentials?
  `}<span className="text-scope-coral">[?]</span>{` What if it modifies files outside the project?

`}<span className="text-scope-rust">You don't know. You can't see. That's the problem.</span>
            </pre>
          </div>
        </section>

        {/* Solution - Feature Cards */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// THE SOLUTION</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="group border border-scope-border hover:border-scope-amber transition-colors duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-scope-amber to-scope-rust opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="p-5">
                <div className="text-scope-amber mb-3 text-lg">[#]</div>
                <h3 className="text-scope-amber mb-2">PATH BOUNDARIES</h3>
                <p className="text-scope-muted text-xs leading-relaxed">
                  Define exactly what AI agents can access. Glob patterns, deny lists, granular control over every path.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group border border-scope-border hover:border-scope-rust transition-colors duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-scope-rust to-scope-burnt opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="p-5">
                <div className="text-scope-rust mb-3 text-lg">[&gt;]</div>
                <h3 className="text-scope-rust mb-2">REAL-TIME MONITORING</h3>
                <p className="text-scope-muted text-xs leading-relaxed">
                  Watch every file operation as it happens. Full visibility into reads, writes, and deletes.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group border border-scope-border hover:border-scope-burnt transition-colors duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-scope-burnt to-scope-terracotta opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="p-5">
                <div className="text-scope-burnt mb-3 text-lg">[!]</div>
                <h3 className="text-scope-burnt mb-2">INSTANT ALERTS</h3>
                <p className="text-scope-muted text-xs leading-relaxed">
                  Get notified when agents try to access sensitive files. Block violations in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// HOW IT WORKS</p>
          <div className="bg-scope-bg-light border border-scope-border p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-scope-amber text-2xl mb-2">1</div>
                <div className="text-scope-amber text-sm mb-1">DEFINE</div>
                <p className="text-scope-muted text-xs">Create rules in<br/>.agentleash.yml</p>
                <pre className="text-xs text-scope-muted mt-2">$ leash init</pre>
              </div>
              <div>
                <div className="text-scope-rust text-2xl mb-2">2</div>
                <div className="text-scope-rust text-sm mb-1">WATCH</div>
                <p className="text-scope-muted text-xs">Start the daemon<br/>with one command</p>
                <pre className="text-xs text-scope-muted mt-2">$ leash watch</pre>
              </div>
              <div>
                <div className="text-scope-burnt text-2xl mb-2">3</div>
                <div className="text-scope-burnt text-sm mb-1">PROTECT</div>
                <p className="text-scope-muted text-xs">Get alerts when<br/>agents cross lines</p>
                <pre className="text-xs text-scope-coral mt-2">[!] BLOCKED</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// LIVE PREVIEW</p>
          <div className="bg-scope-bg-card border border-scope-border">
            <div className="border-b border-scope-border px-4 py-2 flex items-center justify-between">
              <span className="text-scope-amber text-xs">AGENTLEASH</span>
              <span className="text-scope-mint text-xs">[WATCHING...]</span>
            </div>
            <div className="p-4 font-mono text-xs">
              <div className="text-scope-muted mb-3">
                Scope: my-project &nbsp;|&nbsp; Path: ~/projects/myapp &nbsp;|&nbsp; Rules: 15 active
              </div>
              <div className="border-t border-scope-border-light pt-3 space-y-1">
                <div><span className="text-scope-muted">14:32:01</span> <span className="text-scope-mint">[/]</span> <span className="text-scope-muted">READ</span> <span className="text-scope-text">src/components/Button.tsx</span></div>
                <div><span className="text-scope-muted">14:32:02</span> <span className="text-scope-mint">[/]</span> <span className="text-scope-muted">WRITE</span> <span className="text-scope-text">src/components/Button.tsx</span></div>
                <div><span className="text-scope-muted">14:32:05</span> <span className="text-scope-coral">[X]</span> <span className="text-scope-muted">READ</span> <span className="text-scope-text">.env.local</span> <span className="text-scope-coral">[BLOCKED]</span></div>
                <div><span className="text-scope-muted">14:32:08</span> <span className="text-scope-mint">[/]</span> <span className="text-scope-muted">READ</span> <span className="text-scope-text">package.json</span></div>
                <div><span className="text-scope-muted">14:32:10</span> <span className="text-scope-amber">[!]</span> <span className="text-scope-muted">DELETE</span> <span className="text-scope-text">node_modules/lodash/...</span> <span className="text-scope-amber">[WARNING]</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Agents */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// SUPPORTED AGENTS</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'Claude Code', status: 'supported' },
              { name: 'Cursor', status: 'supported' },
              { name: 'Windsurf', status: 'supported' },
              { name: 'Aider', status: 'supported' },
              { name: 'GitHub Copilot', status: 'coming' },
              { name: 'Continue', status: 'coming' },
            ].map((agent) => (
              <div
                key={agent.name}
                className="border border-scope-border px-4 py-3 flex items-center justify-between"
              >
                <span className="text-scope-text text-xs">{agent.name}</span>
                <span className={`text-xs ${agent.status === 'supported' ? 'text-scope-mint' : 'text-scope-muted'}`}>
                  {agent.status === 'supported' ? '[/] Ready' : '[~] Soon'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-scope-muted mt-3 text-center">
            Works with any file-accessing agent via filesystem monitoring
          </p>
        </section>

        {/* Quick Start */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// QUICK START</p>
          <div className="bg-scope-bg-light border border-scope-border p-5">
            <pre className="text-xs leading-relaxed text-scope-text">
<span className="text-scope-muted">$</span> npm install -g agentleash

<span className="text-scope-muted">$</span> cd your-project
<span className="text-scope-muted">$</span> leash init
<span className="text-scope-mint">[/]</span> Created .agentleash/config.yaml
<span className="text-scope-mint">[/]</span> Created .agentleash/rules.yaml

<span className="text-scope-muted">$</span> leash watch --agent claude-code
<span className="text-scope-mint">[/]</span> Monitoring started
<span className="text-scope-mint">[/]</span> Watching: ~/your-project
<span className="text-scope-mint">[/]</span> Rules loaded: 12 allow, 3 deny, 2 warn
            </pre>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// PRICING</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'FREE', price: '$0', features: ['1 scope', '1k logs/day', 'Basic rules'], highlight: false },
              { name: 'PRO', price: '$15', features: ['5 scopes', '10k logs', 'Custom rules', 'Export'], highlight: true },
              { name: 'TEAM', price: '$49', features: ['20 scopes', '100k logs', 'Sharing', 'Webhooks'], highlight: false },
              { name: 'ENTERPRISE', price: '$149', features: ['Unlimited', 'SSO/SAML', 'Compliance', 'Support'], highlight: false },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`border ${tier.highlight ? 'border-scope-amber' : 'border-scope-border'} p-4`}
              >
                <div className={`text-sm mb-1 ${tier.highlight ? 'text-scope-amber' : 'text-scope-text'}`}>{tier.name}</div>
                <div className={`text-lg mb-3 ${tier.highlight ? 'text-scope-amber' : 'text-scope-muted'}`}>{tier.price}<span className="text-xs">/mo</span></div>
                <div className="space-y-1">
                  {tier.features.map((f) => (
                    <div key={f} className="text-xs text-scope-muted">[/] {f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/pricing" className="text-scope-amber text-xs hover:underline">
              View full pricing details →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-scope-border">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="text-scope-amber mb-4">AGENTLEASH</div>
            <p className="text-scope-muted text-xs mb-4">Keep your AI agents in check.</p>
            <div className="flex justify-center gap-6 text-xs">
              <Link href="/docs" className="text-scope-muted hover:text-scope-amber transition-colors">[DOCS]</Link>
              <Link href="/pricing" className="text-scope-muted hover:text-scope-amber transition-colors">[PRICING]</Link>
              <a href="https://github.com/veridiantools/agentleash" className="text-scope-muted hover:text-scope-amber transition-colors">[GITHUB]</a>
              <a href="https://veridiantools.dev" className="text-scope-muted hover:text-scope-amber transition-colors">[VERIDIAN]</a>
            </div>
            <p className="text-scope-muted text-xs mt-6">
              Part of the <a href="https://veridiantools.dev" className="text-scope-rust hover:text-scope-amber transition-colors">Veridian</a> family
            </p>
            <p className="text-scope-border-light text-xs mt-2">© 2025 AgentLeash</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
