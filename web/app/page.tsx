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
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: 'DOCS', href: '/docs' },
                { label: 'PRICING', href: '/pricing' },
                { label: 'GITHUB', href: 'https://github.com/skygkruger' },
                { label: '@', href: 'https://x.com/run_veridian' },
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

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-4">
              <Link href="/docs" className="text-scope-muted text-xs">[DOCS]</Link>
              <Link
                href="/login"
                className="border border-scope-amber text-scope-amber px-3 py-1 text-xs"
              >
                [LOGIN]
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12 md:mb-16">
          {/* ASCII Logo - LEASH */}
          <div className="mb-4 md:mb-6 overflow-x-auto">
            <pre className="text-scope-amber text-[8px] md:text-xs leading-tight inline-block">
{`██╗     ███████╗ █████╗ ███████╗██╗  ██╗
██║     ██╔════╝██╔══██╗██╔════╝██║  ██║
██║     █████╗  ███████║███████╗███████║
██║     ██╔══╝  ██╔══██║╚════██║██╔══██║
███████╗███████╗██║  ██║███████║██║  ██║
╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`}
            </pre>
          </div>

          {/* AGENT Nodes */}
          <div className="mb-4 md:mb-6">
            <pre className="text-scope-amber text-[8px] md:text-xs leading-tight inline-block">
{`┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
└───┘ └───┘ └───┘ └───┘ └───┘`}
            </pre>
          </div>

          {/* Version Tag */}
          <p className="text-[10px] md:text-xs tracking-widest text-scope-rust mb-6 md:mb-8">
            // AI AGENT ACCESS CONTROL v1.0
          </p>

          {/* Tagline */}
          <h1 className="text-lg md:text-xl text-scope-text mb-3 px-4">
            Know exactly what your AI agents access.
          </h1>
          <p className="text-scope-muted text-sm md:text-base max-w-xl mx-auto mb-6 md:mb-8 px-4">
            Monitor file operations in real-time. Define boundaries. Get alerts when agents cross the line.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
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
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// THE PROBLEM</p>
          <div className="bg-scope-bg-light border border-scope-border p-4 md:p-6">
            <pre className="text-xs md:text-sm leading-relaxed text-scope-text whitespace-pre-wrap">
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
        <section className="mb-12 md:mb-16">
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
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// HOW IT WORKS</p>
          <div className="bg-scope-bg-light border border-scope-border p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex md:block items-center gap-4 md:gap-0">
                <div className="text-scope-amber text-2xl md:mb-2">1</div>
                <div className="text-left md:text-center">
                  <div className="text-scope-amber text-sm mb-1">DEFINE</div>
                  <p className="text-scope-muted text-xs">Create rules in .agentleash.yml</p>
                  <pre className="text-xs text-scope-muted mt-2">$ leash init</pre>
                </div>
              </div>
              <div className="flex md:block items-center gap-4 md:gap-0">
                <div className="text-scope-rust text-2xl md:mb-2">2</div>
                <div className="text-left md:text-center">
                  <div className="text-scope-rust text-sm mb-1">WATCH</div>
                  <p className="text-scope-muted text-xs">Start the daemon with one command</p>
                  <pre className="text-xs text-scope-muted mt-2">$ leash watch</pre>
                </div>
              </div>
              <div className="flex md:block items-center gap-4 md:gap-0">
                <div className="text-scope-burnt text-2xl md:mb-2">3</div>
                <div className="text-left md:text-center">
                  <div className="text-scope-burnt text-sm mb-1">PROTECT</div>
                  <p className="text-scope-muted text-xs">Get alerts when agents cross lines</p>
                  <pre className="text-xs text-scope-coral mt-2">[!] BLOCKED</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// LIVE PREVIEW</p>
          <div className="bg-scope-bg-card border border-scope-border overflow-hidden">
            <div className="border-b border-scope-border px-3 md:px-4 py-2 flex items-center justify-between">
              <span className="text-scope-amber text-xs">AGENTLEASH</span>
              <span className="text-scope-mint text-xs">[WATCHING...]</span>
            </div>
            <div className="p-3 md:p-4 font-mono text-[10px] md:text-xs overflow-x-auto">
              <div className="text-scope-muted mb-3 whitespace-nowrap">
                Scope: my-project | Path: ~/projects/myapp | Rules: 15 active
              </div>
              <div className="border-t border-scope-border-light pt-3 space-y-1">
                <div className="whitespace-nowrap"><span className="text-scope-muted">14:32:01</span> <span className="text-scope-mint">[/]</span> <span className="text-scope-muted">READ</span> <span className="text-scope-text">src/components/Button.tsx</span></div>
                <div className="whitespace-nowrap"><span className="text-scope-muted">14:32:02</span> <span className="text-scope-mint">[/]</span> <span className="text-scope-muted">WRITE</span> <span className="text-scope-text">src/components/Button.tsx</span></div>
                <div className="whitespace-nowrap"><span className="text-scope-muted">14:32:05</span> <span className="text-scope-coral">[X]</span> <span className="text-scope-muted">READ</span> <span className="text-scope-text">.env.local</span> <span className="text-scope-coral">[BLOCKED]</span></div>
                <div className="whitespace-nowrap"><span className="text-scope-muted">14:32:08</span> <span className="text-scope-mint">[/]</span> <span className="text-scope-muted">READ</span> <span className="text-scope-text">package.json</span></div>
                <div className="whitespace-nowrap"><span className="text-scope-muted">14:32:10</span> <span className="text-scope-amber">[!]</span> <span className="text-scope-muted">DELETE</span> <span className="text-scope-text">node_modules/...</span> <span className="text-scope-amber">[WARN]</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Agents */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// SUPPORTED AGENTS</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {[
              { name: 'Claude Code', status: 'supported' },
              { name: 'Cursor', status: 'supported' },
              { name: 'Windsurf', status: 'supported' },
              { name: 'Aider', status: 'supported' },
              { name: 'GitHub Copilot', status: 'supported' },
              { name: 'Continue', status: 'supported' },
            ].map((agent) => (
              <div
                key={agent.name}
                className="border border-scope-border px-3 md:px-4 py-2 md:py-3 flex items-center justify-between"
              >
                <span className="text-scope-text text-[10px] md:text-xs">{agent.name}</span>
                <span className={`text-[10px] md:text-xs ${agent.status === 'supported' ? 'text-scope-mint' : 'text-scope-muted'}`}>
                  {agent.status === 'supported' ? '[/]' : '[~]'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] md:text-xs text-scope-muted mt-3 text-center">
            Works with any file-accessing agent via filesystem monitoring
          </p>
        </section>

        {/* Quick Start */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// QUICK START</p>
          <div className="bg-scope-bg-light border border-scope-border p-4 md:p-5 overflow-x-auto">
            <pre className="text-[10px] md:text-xs leading-relaxed text-scope-text whitespace-pre">
<span className="text-scope-muted">$</span> npm install -g agentleash

<span className="text-scope-muted">$</span> cd your-project
<span className="text-scope-muted">$</span> leash init
<span className="text-scope-mint">[/]</span> Created .agentleash/config.yaml
<span className="text-scope-mint">[/]</span> Created .agentleash/rules.yaml

<span className="text-scope-muted">$</span> leash watch --agent claude-code
<span className="text-scope-mint">[/]</span> Monitoring started
<span className="text-scope-mint">[/]</span> Watching: ~/your-project
<span className="text-scope-mint">[/]</span> Rules loaded: 12 allow, 3 deny
            </pre>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider">// PRICING</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {[
              { name: 'FREE', price: '$0', features: ['1 scope', '1k logs/day', 'Basic rules'], highlight: false },
              { name: 'PRO', price: '$15', features: ['5 scopes', '10k logs', 'Custom rules'], highlight: true },
              { name: 'TEAM', price: '$49', features: ['20 scopes', '100k logs', 'Webhooks'], highlight: false },
              { name: 'ENTERPRISE', price: '$149', features: ['Unlimited', 'SSO/SAML', 'Support'], highlight: false },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`border ${tier.highlight ? 'border-scope-amber' : 'border-scope-border'} p-3 md:p-4`}
              >
                <div className={`text-xs md:text-sm mb-1 ${tier.highlight ? 'text-scope-amber' : 'text-scope-text'}`}>{tier.name}</div>
                <div className={`text-base md:text-lg mb-2 md:mb-3 ${tier.highlight ? 'text-scope-amber' : 'text-scope-muted'}`}>{tier.price}<span className="text-[10px] md:text-xs">/mo</span></div>
                <div className="space-y-1">
                  {tier.features.map((f) => (
                    <div key={f} className="text-[10px] md:text-xs text-scope-muted">[/] {f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/pricing" className="text-scope-amber text-[10px] md:text-xs hover:underline">
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
            <p className="text-scope-muted text-xs mb-4">LEASHED WITH &lt;3 IN THE TERMINAL</p>
            <p className="text-scope-muted text-xs mb-4">(c) 2026 AGENTLEASH · A VERIDIAN TOOLS PRODUCT</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs mb-4">
              <Link href="/" className="text-scope-muted hover:text-scope-amber transition-colors">[HOME]</Link>
              <Link href="/docs" className="text-scope-muted hover:text-scope-amber transition-colors">[DOCS]</Link>
              <Link href="/pricing" className="text-scope-muted hover:text-scope-amber transition-colors">[PRICING]</Link>
              <a href="https://github.com/skygkruger" target="_blank" rel="noopener noreferrer" className="text-scope-muted hover:text-scope-amber transition-colors">[GITHUB]</a>
              <a href="https://x.com/run_veridian" target="_blank" rel="noopener noreferrer" className="text-scope-muted hover:text-scope-amber transition-colors">[X]</a>
              <a href="mailto:sky@veridian.run" className="text-scope-muted hover:text-scope-amber transition-colors">[CONTACT]</a>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs mb-6">
              <Link href="/terms" className="text-scope-muted hover:text-scope-amber transition-colors">[TERMS]</Link>
              <Link href="/privacy" className="text-scope-muted hover:text-scope-amber transition-colors">[PRIVACY]</Link>
            </div>
            {/* VERIDIAN Solidarity Footer */}
            <div className="max-w-md mx-auto p-4 border border-scope-border">
              <p className="text-scope-amber text-xs mb-2">15% of revenue supports free emotional tech sanctuaries</p>
              <p className="text-scope-muted text-[10px]">VERIDIAN believes technology should heal, not extract.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
