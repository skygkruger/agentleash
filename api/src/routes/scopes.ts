// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT SCOPES ROUTES
// CRUD operations for scope configurations
// ═══════════════════════════════════════════════════════════════

import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest, requirePlan } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validate';
import { supabaseAdmin, DbScope } from '../db/supabase';

const router = Router();

// ───────────────────────────────────────────────────────────────
// PLAN LIMITS
// ───────────────────────────────────────────────────────────────

const PLAN_LIMITS = {
  free: { maxScopes: 1 },
  pro: { maxScopes: 5 },
  team: { maxScopes: 20 },
  enterprise: { maxScopes: Infinity },
};

// ───────────────────────────────────────────────────────────────
// GET /api/scopes
// ───────────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { data: scopes, error } = await supabaseAdmin
    .from('scopes')
    .select(`
      *,
      scope_rules(count),
      access_logs(count)
    `)
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scopes',
    });
    return;
  }

  res.json({
    success: true,
    data: scopes.map((scope: any) => ({
      id: scope.id,
      name: scope.name,
      description: scope.description,
      basePath: scope.base_path,
      isActive: scope.is_active,
      ruleCount: scope.scope_rules?.[0]?.count || 0,
      logCount: scope.access_logs?.[0]?.count || 0,
      createdAt: scope.created_at,
      updatedAt: scope.updated_at,
    })),
  });
});

// ───────────────────────────────────────────────────────────────
// POST /api/scopes
// ───────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validate(schemas.createScope),
  async (req: AuthRequest, res: Response) => {
    const { name, description, basePath, config } = req.body;

    // Check plan limits
    const { count, error: countError } = await supabaseAdmin
      .from('scopes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id);

    if (countError) {
      res.status(500).json({
        success: false,
        error: 'Failed to check scope limit',
      });
      return;
    }

    const limit = PLAN_LIMITS[req.user!.plan].maxScopes;
    if ((count || 0) >= limit) {
      res.status(403).json({
        success: false,
        error: `You have reached the maximum number of scopes for your plan (${limit}). Upgrade to create more.`,
      });
      return;
    }

    // Create scope
    const configHash = config
      ? crypto.createHash('sha256').update(config).digest('hex')
      : null;

    const { data: scope, error } = await supabaseAdmin
      .from('scopes')
      .insert({
        user_id: req.user!.id,
        name,
        description: description || null,
        base_path: basePath,
        is_active: true,
        config_hash: configHash,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create scope',
      });
      return;
    }

    // If config provided, parse and create rules
    if (config) {
      // TODO: Parse YAML config and create rules
      // This would use the same parser from the daemon
    }

    res.status(201).json({
      success: true,
      data: {
        id: scope.id,
        name: scope.name,
        description: scope.description,
        basePath: scope.base_path,
        isActive: scope.is_active,
        createdAt: scope.created_at,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:id
// ───────────────────────────────────────────────────────────────

router.get(
  '/:id',
  authenticate,
  validateParams(schemas.uuidParam),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const { data: scope, error } = await supabaseAdmin
      .from('scopes')
      .select(`
        *,
        scope_rules(*),
        access_logs(count),
        violation_reports(count)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !scope) {
      res.status(404).json({
        success: false,
        error: 'Scope not found',
      });
      return;
    }

    // Get recent stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await supabaseAdmin
      .from('access_logs')
      .select('result')
      .eq('scope_id', id)
      .gte('created_at', today.toISOString());

    const stats = {
      totalToday: todayLogs?.length || 0,
      allowedToday: todayLogs?.filter((l) => l.result === 'allowed').length || 0,
      blockedToday: todayLogs?.filter((l) => l.result === 'blocked').length || 0,
    };

    res.json({
      success: true,
      data: {
        id: scope.id,
        name: scope.name,
        description: scope.description,
        basePath: scope.base_path,
        isActive: scope.is_active,
        configHash: scope.config_hash,
        rules: scope.scope_rules?.map((rule: any) => ({
          id: rule.id,
          pathPattern: rule.path_pattern,
          ruleType: rule.rule_type,
          operations: rule.operations,
          priority: rule.priority,
          reason: rule.reason,
        })) || [],
        stats,
        createdAt: scope.created_at,
        updatedAt: scope.updated_at,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// PUT /api/scopes/:id
// ───────────────────────────────────────────────────────────────

router.put(
  '/:id',
  authenticate,
  validateParams(schemas.uuidParam),
  validate(schemas.updateScope),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const updateData: Partial<DbScope> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: scope, error } = await supabaseAdmin
      .from('scopes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error || !scope) {
      res.status(404).json({
        success: false,
        error: 'Scope not found or update failed',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: scope.id,
        name: scope.name,
        description: scope.description,
        basePath: scope.base_path,
        isActive: scope.is_active,
        updatedAt: scope.updated_at,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// DELETE /api/scopes/:id
// ───────────────────────────────────────────────────────────────

router.delete(
  '/:id',
  authenticate,
  validateParams(schemas.uuidParam),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    // Or hard delete - depends on requirements
    const { error } = await supabaseAdmin
      .from('scopes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete scope',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Scope deleted',
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:id/sync
// ───────────────────────────────────────────────────────────────

router.post(
  '/:id/sync',
  authenticate,
  validateParams(schemas.uuidParam),
  validate(schemas.syncScope),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { configYaml } = req.body;

    // Verify ownership
    const { data: scope, error: scopeError } = await supabaseAdmin
      .from('scopes')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (scopeError || !scope) {
      res.status(404).json({
        success: false,
        error: 'Scope not found',
      });
      return;
    }

    // TODO: Parse YAML and update rules
    // For now, just update the config hash

    const configHash = crypto.createHash('sha256').update(configYaml).digest('hex');

    const { error } = await supabaseAdmin
      .from('scopes')
      .update({ config_hash: configHash })
      .eq('id', id);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to sync configuration',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Configuration synced',
      data: {
        configHash,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:id/export
// ───────────────────────────────────────────────────────────────

router.get(
  '/:id/export',
  authenticate,
  validateParams(schemas.uuidParam),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const { data: scope, error } = await supabaseAdmin
      .from('scopes')
      .select(`
        *,
        scope_rules(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !scope) {
      res.status(404).json({
        success: false,
        error: 'Scope not found',
      });
      return;
    }

    // Generate YAML config
    const yaml = generateYamlConfig(scope);

    res.setHeader('Content-Type', 'text/yaml');
    res.setHeader('Content-Disposition', `attachment; filename="${scope.name}.scopeagent.yml"`);
    res.send(yaml);
  }
);

// ───────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

function generateYamlConfig(scope: any): string {
  const rules = scope.scope_rules || [];

  let yaml = `# ScopeAgent Configuration
# Exported from dashboard

version: 1
name: "${scope.name}"
base_path: "${scope.base_path}"
default_policy: deny

rules:
`;

  for (const rule of rules) {
    yaml += `  - path: "${rule.path_pattern}"
`;
    if (rule.rule_type === 'allow') {
      yaml += `    allow: [${rule.operations.join(', ')}]
`;
    } else {
      yaml += `    deny: [${rule.operations.join(', ')}]
`;
    }
    if (rule.reason) {
      yaml += `    reason: "${rule.reason}"
`;
    }
    yaml += '\n';
  }

  return yaml;
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default router;
