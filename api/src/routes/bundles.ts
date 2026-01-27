// ═══════════════════════════════════════════════════════════════
// BUNDLE PRICING ROUTES
// VaultAgent + ScopeAgent bundle management
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase } from '../db/supabase';

const router = Router();

// ───────────────────────────────────────────────────────────────
// STRIPE SETUP
// ───────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// ───────────────────────────────────────────────────────────────
// BUNDLE DEFINITIONS
// ───────────────────────────────────────────────────────────────

interface Bundle {
  id: string;
  name: string;
  description: string;
  products: {
    vaultAgent: string;
    scopeAgent: string;
  };
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
    savings: {
      monthly: number;
      yearly: number;
    };
  };
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

const BUNDLES: Bundle[] = [
  {
    id: 'security-stack-pro',
    name: 'AI Security Stack Pro',
    description: 'Complete AI agent security: VaultAgent Pro + ScopeAgent Pro',
    products: {
      vaultAgent: 'pro',
      scopeAgent: 'pro',
    },
    features: [
      'VaultAgent Pro - 10 vaults, 100 secrets',
      'ScopeAgent Pro - 5 scopes, 10,000 logs/day',
      'Cross-product dashboard',
      'Combined audit logs',
      'Priority support',
    ],
    pricing: {
      monthly: 2000, // $20 (cents)
      yearly: 19200, // $192/year ($16/mo)
      savings: {
        monthly: 400, // Save $4/mo vs buying separately
        yearly: 4800, // Save $48/year
      },
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BUNDLE_PRO_MONTHLY || 'price_bundle_pro_monthly',
      yearly: process.env.STRIPE_BUNDLE_PRO_YEARLY || 'price_bundle_pro_yearly',
    },
  },
  {
    id: 'security-stack-team',
    name: 'AI Security Stack Team',
    description: 'Team-scale AI agent security: VaultAgent Team + ScopeAgent Team',
    products: {
      vaultAgent: 'team',
      scopeAgent: 'team',
    },
    features: [
      'VaultAgent Team - 50 vaults, 1,000 secrets',
      'ScopeAgent Team - 20 scopes, 100,000 logs/day',
      'Team collaboration',
      'Webhooks & integrations',
      'Combined audit logs',
      'SSO (SAML)',
      'Priority support',
    ],
    pricing: {
      monthly: 7000, // $70
      yearly: 67200, // $672/year ($56/mo)
      savings: {
        monthly: 800, // Save $8/mo
        yearly: 9600, // Save $96/year
      },
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BUNDLE_TEAM_MONTHLY || 'price_bundle_team_monthly',
      yearly: process.env.STRIPE_BUNDLE_TEAM_YEARLY || 'price_bundle_team_yearly',
    },
  },
  {
    id: 'security-stack-enterprise',
    name: 'AI Security Stack Enterprise',
    description: 'Enterprise AI agent security with unlimited scale',
    products: {
      vaultAgent: 'enterprise',
      scopeAgent: 'enterprise',
    },
    features: [
      'VaultAgent Enterprise - Unlimited vaults & secrets',
      'ScopeAgent Enterprise - Unlimited scopes & logs',
      'Full team collaboration',
      'Advanced webhooks & integrations',
      'Combined audit logs with export',
      'SSO (SAML, OIDC)',
      'Compliance reports',
      'Dedicated support',
      'Custom integrations',
    ],
    pricing: {
      monthly: 24900, // $249
      yearly: 239000, // $2,390/year (~$199/mo)
      savings: {
        monthly: 4900, // Save $49/mo
        yearly: 58800, // Save $588/year
      },
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BUNDLE_ENTERPRISE_MONTHLY || 'price_bundle_enterprise_monthly',
      yearly: process.env.STRIPE_BUNDLE_ENTERPRISE_YEARLY || 'price_bundle_enterprise_yearly',
    },
  },
];

// Individual product prices for comparison
const INDIVIDUAL_PRICES = {
  vaultAgent: {
    pro: { monthly: 1200, yearly: 11520 },
    team: { monthly: 3900, yearly: 37440 },
    enterprise: { monthly: 14900, yearly: 143040 },
  },
  scopeAgent: {
    pro: { monthly: 1500, yearly: 14400 },
    team: { monthly: 4900, yearly: 47040 },
    enterprise: { monthly: 14900, yearly: 143040 },
  },
};

// ───────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ───────────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  bundleId: z.string(),
  interval: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const upgradeSchema = z.object({
  bundleId: z.string(),
  interval: z.enum(['monthly', 'yearly']).optional(),
});

// ───────────────────────────────────────────────────────────────
// ROUTES
// ───────────────────────────────────────────────────────────────

/**
 * GET /api/bundles
 * List all available bundles
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const bundleList = BUNDLES.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      products: bundle.products,
      features: bundle.features,
      pricing: {
        monthly: {
          amount: bundle.pricing.monthly,
          formatted: `$${(bundle.pricing.monthly / 100).toFixed(2)}/mo`,
          savings: bundle.pricing.savings.monthly,
          savingsFormatted: `$${(bundle.pricing.savings.monthly / 100).toFixed(2)}/mo`,
        },
        yearly: {
          amount: bundle.pricing.yearly,
          formatted: `$${(bundle.pricing.yearly / 100).toFixed(2)}/yr`,
          monthlyEquivalent: `$${(bundle.pricing.yearly / 12 / 100).toFixed(2)}/mo`,
          savings: bundle.pricing.savings.yearly,
          savingsFormatted: `$${(bundle.pricing.savings.yearly / 100).toFixed(2)}/yr`,
        },
      },
      comparison: {
        separateMonthly:
          INDIVIDUAL_PRICES.vaultAgent[bundle.products.vaultAgent as keyof typeof INDIVIDUAL_PRICES.vaultAgent].monthly +
          INDIVIDUAL_PRICES.scopeAgent[bundle.products.scopeAgent as keyof typeof INDIVIDUAL_PRICES.scopeAgent].monthly,
        separateYearly:
          INDIVIDUAL_PRICES.vaultAgent[bundle.products.vaultAgent as keyof typeof INDIVIDUAL_PRICES.vaultAgent].yearly +
          INDIVIDUAL_PRICES.scopeAgent[bundle.products.scopeAgent as keyof typeof INDIVIDUAL_PRICES.scopeAgent].yearly,
      },
    }));

    res.json({
      success: true,
      data: {
        bundles: bundleList,
        tagline: 'AI Agent Security Stack',
        description: 'VaultAgent protects secrets FROM agents. ScopeAgent protects systems FROM agents. Together: Complete AI agent security.',
      },
    });
  } catch (error) {
    console.error('Error listing bundles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list bundles',
    });
  }
});

/**
 * GET /api/bundles/:id
 * Get a specific bundle
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bundle = BUNDLES.find((b) => b.id === req.params.id);

    if (!bundle) {
      res.status(404).json({
        success: false,
        error: 'Bundle not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        products: bundle.products,
        features: bundle.features,
        pricing: {
          monthly: {
            amount: bundle.pricing.monthly,
            formatted: `$${(bundle.pricing.monthly / 100).toFixed(2)}/mo`,
            savings: bundle.pricing.savings.monthly,
          },
          yearly: {
            amount: bundle.pricing.yearly,
            formatted: `$${(bundle.pricing.yearly / 100).toFixed(2)}/yr`,
            monthlyEquivalent: `$${(bundle.pricing.yearly / 12 / 100).toFixed(2)}/mo`,
            savings: bundle.pricing.savings.yearly,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting bundle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bundle',
    });
  }
});

/**
 * POST /api/bundles/subscribe
 * Create a checkout session for bundle subscription
 */
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validation = subscribeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.error.errors,
      });
      return;
    }

    const { bundleId, interval, successUrl, cancelUrl } = validation.data;
    const userId = req.user!.id;

    // Find the bundle
    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) {
      res.status(404).json({
        success: false,
        error: 'Bundle not found',
      });
      return;
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: profile?.email || req.user!.email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      // Save to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const priceId = interval === 'monthly'
      ? bundle.stripePriceIds.monthly
      : bundle.stripePriceIds.yearly;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.WEB_URL}/dashboard?checkout=success&bundle=${bundleId}`,
      cancel_url: cancelUrl || `${process.env.WEB_URL}/pricing?checkout=cancelled`,
      metadata: {
        userId,
        bundleId,
        products: JSON.stringify(bundle.products),
      },
      subscription_data: {
        metadata: {
          userId,
          bundleId,
          vaultAgentPlan: bundle.products.vaultAgent,
          scopeAgentPlan: bundle.products.scopeAgent,
        },
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
    });
  }
});

/**
 * GET /api/bundles/upgrade
 * Get available upgrade options for current subscription
 */
router.get('/upgrade/options', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get current subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
      return;
    }

    const currentPlan = profile.plan || 'free';

    // Determine available upgrades
    const planHierarchy = ['free', 'pro', 'team', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);

    const availableUpgrades = BUNDLES.filter((bundle) => {
      const bundlePlanIndex = planHierarchy.indexOf(bundle.products.scopeAgent);
      return bundlePlanIndex > currentIndex;
    }).map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      currentPlan,
      newPlan: bundle.products.scopeAgent,
      pricing: {
        monthly: bundle.pricing.monthly,
        yearly: bundle.pricing.yearly,
      },
      features: bundle.features,
    }));

    res.json({
      success: true,
      data: {
        currentPlan,
        availableUpgrades,
        recommendation: availableUpgrades.length > 0 ? availableUpgrades[0].id : null,
      },
    });
  } catch (error) {
    console.error('Error getting upgrade options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upgrade options',
    });
  }
});

/**
 * POST /api/bundles/upgrade
 * Upgrade to a bundle from current subscription
 */
router.post('/upgrade', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validation = upgradeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.error.errors,
      });
      return;
    }

    const { bundleId, interval = 'monthly' } = validation.data;
    const userId = req.user!.id;

    // Find the bundle
    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) {
      res.status(404).json({
        success: false,
        error: 'Bundle not found',
      });
      return;
    }

    // Get current subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      // No existing subscription, create new checkout
      res.status(400).json({
        success: false,
        error: 'No existing subscription. Use /subscribe instead.',
      });
      return;
    }

    // Find existing subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No active subscription found. Use /subscribe instead.',
      });
      return;
    }

    const currentSubscription = subscriptions.data[0];
    const priceId = interval === 'monthly'
      ? bundle.stripePriceIds.monthly
      : bundle.stripePriceIds.yearly;

    // Calculate prorated amount
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: profile.stripe_customer_id,
      subscription: currentSubscription.id,
      subscription_items: [
        {
          id: currentSubscription.items.data[0].id,
          price: priceId,
        },
      ],
    });

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        userId,
        bundleId,
        vaultAgentPlan: bundle.products.vaultAgent,
        scopeAgentPlan: bundle.products.scopeAgent,
      },
    });

    // Update profile plan
    await supabase
      .from('profiles')
      .update({
        plan: bundle.products.scopeAgent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    res.json({
      success: true,
      data: {
        subscriptionId: updatedSubscription.id,
        newPlan: bundle.products.scopeAgent,
        proratedAmount: upcomingInvoice.amount_due,
        effectiveDate: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription',
    });
  }
});

/**
 * GET /api/bundles/status
 * Get bundle subscription status for current user
 */
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get profile with Stripe info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
      return;
    }

    // Check for active bundle subscription
    let bundleSubscription = null;
    if (profile.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 10,
      });

      for (const sub of subscriptions.data) {
        if (sub.metadata.bundleId) {
          const bundle = BUNDLES.find((b) => b.id === sub.metadata.bundleId);
          if (bundle) {
            bundleSubscription = {
              bundleId: sub.metadata.bundleId,
              bundleName: bundle.name,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              products: bundle.products,
            };
            break;
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        currentPlan: profile.plan || 'free',
        hasBundle: bundleSubscription !== null,
        bundle: bundleSubscription,
        availableBundles: BUNDLES.map((b) => ({
          id: b.id,
          name: b.name,
          plan: b.products.scopeAgent,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting bundle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bundle status',
    });
  }
});

/**
 * POST /api/bundles/cancel
 * Cancel bundle subscription
 */
router.post('/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { immediately = false } = req.body;

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      res.status(400).json({
        success: false,
        error: 'No subscription found',
      });
      return;
    }

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No active subscription found',
      });
      return;
    }

    const subscription = subscriptions.data[0];

    if (immediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.id);

      // Downgrade to free
      await supabase
        .from('profiles')
        .update({ plan: 'free', updated_at: new Date().toISOString() })
        .eq('id', userId);

      res.json({
        success: true,
        data: {
          message: 'Subscription cancelled immediately',
          effectiveDate: new Date().toISOString(),
          newPlan: 'free',
        },
      });
    } else {
      // Cancel at period end
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      res.json({
        success: true,
        data: {
          message: 'Subscription will cancel at end of billing period',
          effectiveDate: new Date(updated.current_period_end * 1000).toISOString(),
          currentPlan: updated.metadata.scopeAgentPlan || 'pro',
        },
      });
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
    });
  }
});

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default router;
