'use client';

// ═══════════════════════════════════════════════════════════════
// AGENTLEASH PRICING PAGE
// Bundle pricing with VaultAgent
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';

interface Bundle {
  id: string;
  name: string;
  description: string;
  products: { vaultAgent: string; scopeAgent: string };
  features: string[];
  pricing: {
    monthly: { amount: number; formatted: string; savings: number; savingsFormatted: string };
    yearly: { amount: number; formatted: string; monthlyEquivalent: string; savings: number; savingsFormatted: string };
  };
  comparison: { separateMonthly: number; separateYearly: number };
}

// Individual plans for comparison
const INDIVIDUAL_PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPricePerMonth: 0,
    yearlyTotal: 0,
    scopes: '1',
    logs: '1,000/day',
    features: ['Basic monitoring', 'Email alerts', 'Community support'],
    highlight: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 15,
    yearlyPricePerMonth: 12,
    yearlyTotal: 144,
    scopes: '5',
    logs: '10,000/day',
    features: ['Custom rules', 'Export logs', 'Priority support', 'Webhooks'],
    highlight: false,
  },
  {
    name: 'Team',
    monthlyPrice: 49,
    yearlyPricePerMonth: 39,
    yearlyTotal: 468,
    scopes: '20',
    logs: '100,000/day',
    features: ['Team collaboration', 'SSO', 'Audit logs', 'API access'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: 149,
    yearlyPricePerMonth: 119,
    yearlyTotal: 1428,
    scopes: 'Unlimited',
    logs: 'Unlimited',
    features: ['Custom integrations', 'Dedicated support', 'Compliance reports', 'On-prem option'],
    highlight: false,
  },
];

export default function PricingPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    api.getBundles().then((result) => {
      if (result.success && result.data) {
        setBundles(result.data.bundles);
      }
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (bundleId: string) => {
    setSubscribing(bundleId);
    try {
      const result = await api.subscribeToBundle(bundleId, billingInterval);
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      }
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-scope-bg">
      {/* Header - Veridian Style */}
      <header className="border-b border-scope-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-scope-amber text-base md:text-lg">AGENTLEASH</span>
              <span className="text-scope-amber animate-cursor-blink">_</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: 'HOME', href: '/' },
                { label: 'DOCS', href: '/docs' },
                { label: 'PRICING', href: '/pricing', active: true },
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
              <Link
                href="/login"
                className="border border-scope-amber text-scope-amber px-4 py-1.5 hover:bg-scope-amber hover:text-scope-bg transition-all duration-200"
              >
                [LOGIN]
              </Link>
            </nav>

            {/* Mobile Nav */}
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs text-scope-rust mb-2 tracking-wider">// PRICING</p>
          <h1 className="text-xl md:text-2xl text-scope-amber mb-2">Choose Your Plan</h1>
          <p className="text-scope-muted text-sm">
            Start free, upgrade when you need more
          </p>
        </div>

        {/* Interval Toggle */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex border border-scope-border">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 md:px-4 py-2 text-[10px] md:text-xs transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-scope-amber text-scope-bg'
                  : 'text-scope-muted hover:text-scope-amber'
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-3 md:px-4 py-2 text-[10px] md:text-xs transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-scope-amber text-scope-bg'
                  : 'text-scope-muted hover:text-scope-amber'
              }`}
            >
              YEARLY <span className="text-scope-mint">(20%)</span>
            </button>
          </div>
        </div>

        {/* Individual Plans */}
        <section className="mb-12 md:mb-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider text-center">// AGENTLEASH PLANS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {INDIVIDUAL_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`border p-3 md:p-6 transition-colors ${
                  plan.highlight
                    ? 'border-scope-amber'
                    : 'border-scope-border hover:border-scope-rust'
                }`}
              >
                {plan.highlight && (
                  <div className="text-[10px] md:text-xs text-scope-amber mb-2">[POPULAR]</div>
                )}
                <h3 className="text-sm md:text-lg text-scope-text mb-1">{plan.name}</h3>
                <div className="text-lg md:text-2xl text-scope-amber mb-1">
                  {plan.monthlyPrice === 0
                    ? '$0'
                    : `$${billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPricePerMonth}/mo`}
                </div>
                {billingInterval === 'yearly' && plan.yearlyTotal > 0 && (
                  <div className="text-[10px] md:text-xs text-scope-muted mb-1">
                    Billed ${plan.yearlyTotal}/yr
                  </div>
                )}
                <div className="text-[10px] md:text-xs text-scope-muted mb-2 md:mb-4 space-y-0.5 md:space-y-1">
                  <p>Scopes: {plan.scopes}</p>
                  <p>Logs: {plan.logs}</p>
                </div>
                <ul className="text-[10px] md:text-xs text-scope-muted space-y-0.5 md:space-y-1 mb-4 md:mb-6 hidden md:block">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-scope-mint">[/]</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  className="w-full text-[10px] md:text-xs"
                  onClick={() => window.location.href = '/register'}
                >
                  {plan.name === 'Free' ? '[FREE]' : '[GET]'}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Bundle Section */}
        <section className="border-t border-scope-border pt-12 md:pt-16">
          <div className="text-center mb-6 md:mb-8">
            <p className="text-xs text-scope-rust mb-2 tracking-wider">// BUNDLE & SAVE</p>
            <h2 className="text-lg md:text-xl text-scope-amber mb-2">AI Agent Security Stack</h2>
            <p className="text-scope-muted max-w-xl mx-auto text-xs md:text-sm px-4">
              VaultAgent protects secrets FROM agents. AgentLeash controls file access.
              Together: Complete AI agent security.
            </p>
          </div>

          {/* Bundle Cards */}
          {loading ? (
            <div className="text-center py-12 text-scope-muted animate-pulse">
              [~] Loading bundles...
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-scope-muted">Bundle pricing coming soon</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {bundles.map((bundle, index) => (
                <div
                  key={bundle.id}
                  className={`border p-4 md:p-6 ${
                    index === 1
                      ? 'border-scope-amber'
                      : 'border-scope-border'
                  }`}
                >
                  {index === 1 && (
                    <div className="text-[10px] md:text-xs text-scope-amber mb-2">[BEST VALUE]</div>
                  )}
                  <h3 className="text-base md:text-lg text-scope-text mb-1">{bundle.name}</h3>
                  <p className="text-[10px] md:text-xs text-scope-muted mb-3 md:mb-4">{bundle.description}</p>

                  <div className="mb-3 md:mb-4">
                    <div className="text-xl md:text-2xl text-scope-amber">
                      {billingInterval === 'monthly'
                        ? bundle.pricing.monthly.formatted
                        : bundle.pricing.yearly.monthlyEquivalent}
                    </div>
                    {billingInterval === 'yearly' && (
                      <div className="text-[10px] md:text-xs text-scope-muted">
                        Billed {bundle.pricing.yearly.formatted}
                      </div>
                    )}
                    <div className="text-[10px] md:text-xs text-scope-mint mt-1">
                      Save {billingInterval === 'monthly'
                        ? bundle.pricing.monthly.savingsFormatted
                        : bundle.pricing.yearly.savingsFormatted}
                    </div>
                  </div>

                  <div className="border-t border-scope-border-light pt-3 md:pt-4 mb-3 md:mb-4">
                    <p className="text-[10px] md:text-xs text-scope-muted mb-2">INCLUDES:</p>
                    <ul className="text-[10px] md:text-xs space-y-1">
                      {bundle.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-scope-text">
                          <span className="text-scope-mint">[/]</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={index === 1 ? 'primary' : 'secondary'}
                    className="w-full text-xs"
                    onClick={() => handleSubscribe(bundle.id)}
                    loading={subscribing === bundle.id}
                  >
                    [GET BUNDLE]
                  </Button>

                  <div className="text-[10px] md:text-xs text-scope-muted text-center mt-2 md:mt-3">
                    vs ${(bundle.comparison.separateMonthly / 100).toFixed(0)}/mo separately
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className="border-t border-scope-border mt-12 md:mt-16 pt-12 md:pt-16">
          <p className="text-xs text-scope-rust mb-4 tracking-wider text-center">// FAQ</p>
          <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
            {[
              {
                q: 'What is the AI Agent Security Stack?',
                a: 'The AI Agent Security Stack combines VaultAgent and AgentLeash for complete protection. VaultAgent protects your secrets (API keys, credentials) from being accessed by AI agents, while AgentLeash controls what files and directories AI agents can access.',
              },
              {
                q: 'Can I use AgentLeash without VaultAgent?',
                a: 'Yes! AgentLeash works independently to monitor and control file system access. However, for complete AI agent security, we recommend using both products together.',
              },
              {
                q: 'How do bundles work?',
                a: 'Bundles give you both VaultAgent and AgentLeash at a discounted price. You get a unified dashboard, combined audit logs, and priority support.',
              },
              {
                q: 'Can I upgrade later?',
                a: "Absolutely! You can start with a free plan and upgrade anytime. When upgrading mid-cycle, you'll only pay the prorated difference.",
              },
            ].map((faq, i) => (
              <div key={i} className="border border-scope-border p-3 md:p-4">
                <h3 className="text-scope-text text-xs md:text-sm mb-2">[?] {faq.q}</h3>
                <p className="text-[10px] md:text-xs text-scope-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center mt-12 md:mt-16 py-8 md:py-12 border border-scope-amber mx-2 md:mx-0">
          <h2 className="text-base md:text-lg text-scope-amber mb-3">Ready to secure your AI agents?</h2>
          <p className="text-scope-muted text-xs md:text-sm mb-4 md:mb-6 px-4">
            Start with a free account. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block border border-scope-amber text-scope-amber px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm hover:bg-scope-amber hover:text-scope-bg transition-all duration-200"
          >
            [GET STARTED FREE]
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-scope-border mt-12 md:mt-16">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-[10px] md:text-xs mb-4">
              <Link href="/docs" className="text-scope-muted hover:text-scope-amber transition-colors">[DOCS]</Link>
              <Link href="/pricing" className="text-scope-muted hover:text-scope-amber transition-colors">[PRICING]</Link>
              <a href="https://github.com/skygkruger" className="text-scope-muted hover:text-scope-amber transition-colors">[GITHUB]</a>
              <a href="https://veridiantools.dev" className="text-scope-muted hover:text-scope-amber transition-colors">[VERIDIAN]</a>
              <a href="mailto:sky@veridian.run" className="text-scope-muted hover:text-scope-amber transition-colors">[CONTACT]</a>
            </div>
            <p className="text-scope-muted text-[10px] md:text-xs">
              Part of the <a href="https://veridiantools.dev" className="text-scope-rust hover:text-scope-amber transition-colors">Veridian</a> family
            </p>
            <p className="text-scope-border text-[10px] md:text-xs mt-2">© 2025 AgentLeash</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
