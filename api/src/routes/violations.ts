// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT VIOLATIONS ROUTES
// Violation reports and acknowledgment
// ═══════════════════════════════════════════════════════════════

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validate';
import { supabaseAdmin } from '../db/supabase';

const router = Router({ mergeParams: true });

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
// GET /api/scopes/:scopeId/violations
// ───────────────────────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const {
      limit = 50,
      offset = 0,
      severity,
      type,
      acknowledged,
      startDate,
      endDate,
    } = req.query;

    let query = supabaseAdmin
      .from('violation_reports')
      .select('*', { count: 'exact' })
      .eq('scope_id', scopeId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (type) {
      query = query.eq('violation_type', type);
    }
    if (acknowledged !== undefined) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }
    if (startDate) {
      query = query.gte('created_at', startDate as string);
    }
    if (endDate) {
      query = query.lte('created_at', endDate as string);
    }

    const { data: violations, count, error } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch violations',
      });
      return;
    }

    res.json({
      success: true,
      data: violations?.map((v) => ({
        id: v.id,
        severity: v.severity,
        type: v.violation_type,
        description: v.description,
        affectedPaths: v.affected_paths,
        recommendedAction: v.recommended_action,
        acknowledged: v.acknowledged,
        acknowledgedAt: v.acknowledged_at,
        createdAt: v.created_at,
      })) || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: (count || 0) > Number(offset) + Number(limit),
    });
  }
);

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:scopeId/violations/summary
// ───────────────────────────────────────────────────────────────

router.get(
  '/summary',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;

    // Get all unacknowledged violations
    const { data: violations, error } = await supabaseAdmin
      .from('violation_reports')
      .select('severity, violation_type, acknowledged')
      .eq('scope_id', scopeId);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch violation summary',
      });
      return;
    }

    // Count by severity
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // Count by type
    const byType: Record<string, number> = {};

    // Count unacknowledged
    let unacknowledged = 0;

    for (const v of violations || []) {
      bySeverity[v.severity as keyof typeof bySeverity]++;
      byType[v.violation_type] = (byType[v.violation_type] || 0) + 1;
      if (!v.acknowledged) unacknowledged++;
    }

    res.json({
      success: true,
      data: {
        total: violations?.length || 0,
        unacknowledged,
        bySeverity,
        byType,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:scopeId/violations/:id
// ───────────────────────────────────────────────────────────────

router.get(
  '/:id',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId, id } = req.params;

    const { data: violation, error } = await supabaseAdmin
      .from('violation_reports')
      .select('*')
      .eq('id', id)
      .eq('scope_id', scopeId)
      .single();

    if (error || !violation) {
      res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: violation.id,
        severity: violation.severity,
        type: violation.violation_type,
        description: violation.description,
        affectedPaths: violation.affected_paths,
        recommendedAction: violation.recommended_action,
        acknowledged: violation.acknowledged,
        acknowledgedAt: violation.acknowledged_at,
        sessionId: violation.session_id,
        createdAt: violation.created_at,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:scopeId/violations/:id/acknowledge
// ───────────────────────────────────────────────────────────────

router.post(
  '/:id/acknowledge',
  authenticate,
  validateParams(schemas.scopeIdParam),
  validate(schemas.acknowledgeViolation),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId, id } = req.params;
    const { note: _note } = req.body;

    const { data: violation, error } = await supabaseAdmin
      .from('violation_reports')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        // Store note in metadata or a separate field if needed
      })
      .eq('id', id)
      .eq('scope_id', scopeId)
      .select()
      .single();

    if (error || !violation) {
      res.status(404).json({
        success: false,
        error: 'Violation not found or already acknowledged',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: violation.id,
        acknowledged: violation.acknowledged,
        acknowledgedAt: violation.acknowledged_at,
      },
      message: 'Violation acknowledged',
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:scopeId/violations (for daemon to report)
// ───────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { violations } = req.body;

    if (!Array.isArray(violations) || violations.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Violations array is required',
      });
      return;
    }

    // Limit batch size
    if (violations.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Maximum 50 violations per batch',
      });
      return;
    }

    const violationsToInsert = violations.map((v: any) => ({
      scope_id: scopeId,
      session_id: v.sessionId || null,
      severity: v.severity,
      violation_type: v.type,
      description: v.description,
      affected_paths: v.affectedPaths || null,
      recommended_action: v.recommendedAction || null,
      acknowledged: false,
    }));

    const { data, error } = await supabaseAdmin
      .from('violation_reports')
      .insert(violationsToInsert)
      .select();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to save violations',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        saved: data?.length || 0,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// DELETE /api/scopes/:scopeId/violations/:id
// ───────────────────────────────────────────────────────────────

router.delete(
  '/:id',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId, id } = req.params;

    const { error } = await supabaseAdmin
      .from('violation_reports')
      .delete()
      .eq('id', id)
      .eq('scope_id', scopeId);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete violation',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Violation deleted',
    });
  }
);

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default router;
