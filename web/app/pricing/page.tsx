'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT PRICING PAGE
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
    price: '$0',
    scopes: '1',
    logs: '1,000/day',
    features: ['Basic monitoring', 'Email alerts', 'Community support'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$15/mo',
    scopes: '5',
    logs: '10,000/day',
    features: ['Custom rules', 'Export logs', 'Priority support', 'Webhooks'],
    highlight: false,
  },
  {
    name: 'Team',
    price: '$49/mo',
    scopes: '20',
    logs: '100,000/day',
    features: ['Team collaboration', 'SSO', 'Audit logs', 'API access'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$149/mo',
    scopes: 'Unlimited',
    logs: 'Unlimited',
    features: ['Custom integrations', 'Dedicated support', 'Compliance reports', 'On-prem option'],
    highlight: false,
  },
];

export default function PricingPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);

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
      const result = await api.subscribeToBundle(bundleId, interval);
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      }
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-scope-bg">
      {/* Header */}
      <header className="border-b border-scope-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-scope-amber text-lg">
            {'// SCOPEAGENT'}
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-scope-muted text-xs hover:text-scope-amber">
              [LOGIN]
            </Link>
            <Link href="/register" className="text-scope-amber text-xs hover:text-scope-cream">
              [GET STARTED]
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl text-scope-amber mb-2">{'// PRICING'}</h1>
          <p className="text-scope-text">
            Choose a plan that fits your needs
          </p>
        </div>

        {/* Interval Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex border border-scope-border">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-4 py-2 text-xs ${
                interval === 'monthly'
                  ? 'bg-scope-amber text-scope-bg'
                  : 'text-scope-muted hover:text-scope-amber'
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-4 py-2 text-xs ${
                interval === 'yearly'
                  ? 'bg-scope-amber text-scope-bg'
                  : 'text-scope-muted hover:text-scope-amber'
              }`}
            >
              YEARLY (SAVE 20%)
            </button>
          </div>
        </div>

        {/* Individual Plans */}
        <div className="mb-16">
          <h2 className="text-xl text-scope-amber mb-6 text-center">{'// SCOPEAGENT PLANS'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {INDIVIDUAL_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`border p-6 ${
                  plan.highlight
                    ? 'border-scope-amber bg-scope-amber/5'
                    : 'border-scope-border bg-scope-bg-card'
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs text-scope-amber mb-2">[POPULAR]</div>
                )}
                <h3 className="text-lg text-scope-text mb-1">{plan.name}</h3>
                <div className="text-2xl text-scope-amber mb-4">{plan.price}</div>
                <div className="text-xs text-scope-muted mb-4 space-y-1">
                  <p>Scopes: {plan.scopes}</p>
                  <p>Logs: {plan.logs}</p>
                </div>
                <ul className="text-xs text-scope-muted space-y-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-scope-mint">[/]</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  className="w-full"
                  onClick={() => window.location.href = '/register'}
                >
                  {plan.name === 'Free' ? '[START FREE]' : '[SUBSCRIBE]'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle Section */}
        <div className="border-t border-scope-border pt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl text-scope-amber mb-2">{'// AI AGENT SECURITY STACK'}</h2>
            <p className="text-scope-text max-w-2xl mx-auto">
              VaultAgent protects secrets FROM agents. ScopeAgent protects systems FROM agents.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bundles.map((bundle, index) => (
                <div
                  key={bundle.id}
                  className={`border p-6 ${
                    index === 1
                      ? 'border-scope-amber bg-scope-amber/5'
                      : 'border-scope-border bg-scope-bg-card'
                  }`}
                >
                  {index === 1 && (
                    <div className="text-xs text-scope-amber mb-2">[BEST VALUE]</div>
                  )}
                  <h3 className="text-lg text-scope-text mb-1">{bundle.name}</h3>
                  <p className="text-xs text-scope-muted mb-4">{bundle.description}</p>

                  <div className="mb-4">
                    <div className="text-2xl text-scope-amber">
                      {interval === 'monthly'
                        ? bundle.pricing.monthly.formatted
                        : bundle.pricing.yearly.monthlyEquivalent}
                    </div>
                    {interval === 'yearly' && (
                      <div className="text-xs text-scope-muted">
                        Billed {bundle.pricing.yearly.formatted}
                      </div>
                    )}
                    <div className="text-xs text-scope-mint mt-1">
                      Save {interval === 'monthly'
                        ? bundle.pricing.monthly.savingsFormatted
                        : bundle.pricing.yearly.savingsFormatted}
                    </div>
                  </div>

                  <div className="border-t border-scope-border-light pt-4 mb-4">
                    <p className="text-xs text-scope-muted mb-2">INCLUDES:</p>
                    <ul className="text-xs space-y-1">
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
                    className="w-full"
                    onClick={() => handleSubscribe(bundle.id)}
                    loading={subscribing === bundle.id}
                  >
                    [GET BUNDLE]
                  </Button>

                  <div className="text-xs text-scope-muted text-center mt-3">
                    vs ${(bundle.comparison.separateMonthly / 100).toFixed(0)}/mo separately
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="border-t border-scope-border mt-16 pt-16">
          <h2 className="text-xl text-scope-amber mb-8 text-center">{'// FAQ'}</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border border-scope-border p-4">
              <h3 className="text-scope-text mb-2">[?] What is the AI Agent Security Stack?</h3>
              <p className="text-xs text-scope-muted">
                The AI Agent Security Stack combines VaultAgent and ScopeAgent for complete protection.
                VaultAgent protects your secrets (API keys, credentials) from being accessed by AI agents,
                while ScopeAgent controls what files and directories AI agents can access.
              </p>
            </div>
            <div className="border border-scope-border p-4">
              <h3 className="text-scope-text mb-2">[?] Can I use ScopeAgent without VaultAgent?</h3>
              <p className="text-xs text-scope-muted">
                Yes! ScopeAgent works independently to monitor and control file system access.
                However, for complete AI agent security, we recommend using both products together.
              </p>
            </div>
            <div className="border border-scope-border p-4">
              <h3 className="text-scope-text mb-2">[?] How do bundles work?</h3>
              <p className="text-xs text-scope-muted">
                Bundles give you both VaultAgent and ScopeAgent at a discounted price.
                You get a unified dashboard, combined audit logs, and priority support.
                Bundle subscriptions are billed together for convenience.
              </p>
            </div>
            <div className="border border-scope-border p-4">
              <h3 className="text-scope-text mb-2">[?] Can I upgrade later?</h3>
              <p className="text-xs text-scope-muted">
                Absolutely! You can start with a free plan and upgrade anytime.
                When upgrading mid-cycle, you'll only pay the prorated difference.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 py-12 border border-scope-amber bg-scope-amber/5">
          <h2 className="text-xl text-scope-amber mb-4">Ready to secure your AI agents?</h2>
          <p className="text-scope-muted text-sm mb-6">
            Start with a free account. No credit card required.
          </p>
          <Button onClick={() => window.location.href = '/register'}>
            [GET STARTED FREE]
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-scope-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-xs text-scope-muted">
              {new Date().getFullYear()} Veridian Labs. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs text-scope-muted">
              <Link href="/docs" className="hover:text-scope-amber">Docs</Link>
              <Link href="/privacy" className="hover:text-scope-amber">Privacy</Link>
              <Link href="/terms" className="hover:text-scope-amber">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
