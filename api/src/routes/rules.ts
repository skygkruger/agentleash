// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT RULES ROUTES
// CRUD operations for scope rules
// ═══════════════════════════════════════════════════════════════

import { Router, Response } from 'express';
import { minimatch } from 'minimatch';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validate';
import { supabaseAdmin } from '../db/supabase';

const router = Router({ mergeParams: true }); // mergeParams to access :scopeId

// ───────────────────────────────────────────────────────────────
// MIDDLEWARE: Verify scope ownership
// ───────────────────────────────────────────────────────────────

async function verifyScopeOwnership(
  req: AuthRequest,
  res: Response,
  next: () => void
) {
  const { scopeId } = req.params;

  const { data: scope, error } = await supabaseAdmin
    .from('scopes')
    .select('id')
    .eq('id', scopeId)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !scope) {
    res.status(404).json({
      success: false,
      error: 'Scope not found',
    });
    return;
  }

  next();
}

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:scopeId/rules
// ───────────────────────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;

    const { data: rules, error } = await supabaseAdmin
      .from('scope_rules')
      .select('*')
      .eq('scope_id', scopeId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rules',
      });
      return;
    }

    res.json({
      success: true,
      data: rules.map((rule) => ({
        id: rule.id,
        pathPattern: rule.path_pattern,
        ruleType: rule.rule_type,
        operations: rule.operations,
        priority: rule.priority,
        reason: rule.reason,
        createdAt: rule.created_at,
      })),
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:scopeId/rules
// ───────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validateParams(schemas.scopeIdParam),
  validate(schemas.createRule),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { pathPattern, ruleType, operations, priority, reason } = req.body;

    // Validate glob pattern
    if (!isValidGlobPattern(pathPattern)) {
      res.status(400).json({
        success: false,
        error: 'Invalid glob pattern',
      });
      return;
    }

    const { data: rule, error } = await supabaseAdmin
      .from('scope_rules')
      .insert({
        scope_id: scopeId,
        path_pattern: pathPattern,
        rule_type: ruleType,
        operations,
        priority: priority ?? 0,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create rule',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        id: rule.id,
        pathPattern: rule.path_pattern,
        ruleType: rule.rule_type,
        operations: rule.operations,
        priority: rule.priority,
        reason: rule.reason,
        createdAt: rule.created_at,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// PUT /api/scopes/:scopeId/rules/:ruleId
// ───────────────────────────────────────────────────────────────

router.put(
  '/:ruleId',
  authenticate,
  validateParams(schemas.ruleIdParam),
  validate(schemas.updateRule),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId, ruleId } = req.params;
    const { pathPattern, ruleType, operations, priority, reason } = req.body;

    // Validate glob pattern if provided
    if (pathPattern && !isValidGlobPattern(pathPattern)) {
      res.status(400).json({
        success: false,
        error: 'Invalid glob pattern',
      });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (pathPattern !== undefined) updateData.path_pattern = pathPattern;
    if (ruleType !== undefined) updateData.rule_type = ruleType;
    if (operations !== undefined) updateData.operations = operations;
    if (priority !== undefined) updateData.priority = priority;
    if (reason !== undefined) updateData.reason = reason;

    const { data: rule, error } = await supabaseAdmin
      .from('scope_rules')
      .update(updateData)
      .eq('id', ruleId)
      .eq('scope_id', scopeId)
      .select()
      .single();

    if (error || !rule) {
      res.status(404).json({
        success: false,
        error: 'Rule not found or update failed',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: rule.id,
        pathPattern: rule.path_pattern,
        ruleType: rule.rule_type,
        operations: rule.operations,
        priority: rule.priority,
        reason: rule.reason,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// DELETE /api/scopes/:scopeId/rules/:ruleId
// ───────────────────────────────────────────────────────────────

router.delete(
  '/:ruleId',
  authenticate,
  validateParams(schemas.ruleIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId, ruleId } = req.params;

    const { error } = await supabaseAdmin
      .from('scope_rules')
      .delete()
      .eq('id', ruleId)
      .eq('scope_id', scopeId);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete rule',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Rule deleted',
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:scopeId/rules/test
// ───────────────────────────────────────────────────────────────

router.post(
  '/test',
  authenticate,
  validateParams(schemas.scopeIdParam),
  validate(schemas.testRule),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { filePath, operation } = req.body;

    // Get all rules for this scope
    const { data: rules, error } = await supabaseAdmin
      .from('scope_rules')
      .select('*')
      .eq('scope_id', scopeId)
      .order('priority', { ascending: false });

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rules',
      });
      return;
    }

    // Get scope default policy
    const { data: scope } = await supabaseAdmin
      .from('scopes')
      .select('base_path')
      .eq('id', scopeId)
      .single();

    // Test path against rules
    const result = testPathAgainstRules(filePath, operation, rules || []);

    res.json({
      success: true,
      data: {
        path: filePath,
        operation,
        allowed: result.allowed,
        reason: result.reason,
        matchedRule: result.matchedRule
          ? {
              id: result.matchedRule.id,
              pathPattern: result.matchedRule.path_pattern,
              ruleType: result.matchedRule.rule_type,
            }
          : null,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:scopeId/rules/bulk
// ───────────────────────────────────────────────────────────────

router.post(
  '/bulk',
  authenticate,
  validateParams(schemas.scopeIdParam),
  validate(schemas.bulkRules),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { rules, mode } = req.body;

    // Validate all patterns
    for (const rule of rules) {
      if (!isValidGlobPattern(rule.pathPattern)) {
        res.status(400).json({
          success: false,
          error: `Invalid glob pattern: ${rule.pathPattern}`,
        });
        return;
      }
    }

    // If replace mode, delete existing rules first
    if (mode === 'replace') {
      const { error: deleteError } = await supabaseAdmin
        .from('scope_rules')
        .delete()
        .eq('scope_id', scopeId);

      if (deleteError) {
        res.status(500).json({
          success: false,
          error: 'Failed to clear existing rules',
        });
        return;
      }
    }

    // Insert new rules
    const rulesToInsert = rules.map((rule: any, index: number) => ({
      scope_id: scopeId,
      path_pattern: rule.pathPattern,
      rule_type: rule.ruleType,
      operations: rule.operations,
      priority: rule.priority ?? index,
      reason: rule.reason || null,
    }));

    const { data: insertedRules, error } = await supabaseAdmin
      .from('scope_rules')
      .insert(rulesToInsert)
      .select();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create rules',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        created: insertedRules?.length || 0,
        rules: insertedRules?.map((rule) => ({
          id: rule.id,
          pathPattern: rule.path_pattern,
          ruleType: rule.rule_type,
        })),
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

function isValidGlobPattern(pattern: string): boolean {
  if (!pattern || pattern.length === 0) return false;

  // Check for unbalanced brackets
  const openBrackets = (pattern.match(/\[/g) || []).length;
  const closeBrackets = (pattern.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) return false;

  const openBraces = (pattern.match(/\{/g) || []).length;
  const closeBraces = (pattern.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) return false;

  return true;
}

function testPathAgainstRules(
  filePath: string,
  operation: string,
  rules: any[]
): { allowed: boolean; reason: string; matchedRule?: any } {
  // Normalize path
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const rule of rules) {
    const matches = minimatch(normalizedPath, rule.path_pattern, {
      dot: true,
      matchBase: true,
    });

    if (matches) {
      const operations = rule.operations as string[];
      if (operations.includes(operation)) {
        const allowed = rule.rule_type === 'allow';
        return {
          allowed,
          reason: rule.reason || `Matched rule: ${rule.path_pattern}`,
          matchedRule: rule,
        };
      }
    }
  }

  // Default policy: deny
  return {
    allowed: false,
    reason: 'No matching rule found (default: deny)',
  };
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default router;
