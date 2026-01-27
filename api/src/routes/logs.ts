// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT LOGS ROUTES
// Access log queries and exports
// ═══════════════════════════════════════════════════════════════

import { Router, Response } from 'express';
import { authenticate, AuthRequest, requirePlan } from '../middleware/auth';
import { validateParams, validateQuery, schemas } from '../middleware/validate';
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
// GET /api/scopes/:scopeId/logs
// ───────────────────────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  validateParams(schemas.scopeIdParam),
  validateQuery(schemas.logsQuery),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const {
      limit = 50,
      offset = 0,
      operation,
      result,
      startDate,
      endDate,
      path,
      agent,
    } = req.query as any;

    let query = supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact' })
      .eq('scope_id', scopeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (operation) {
      query = query.eq('operation', operation);
    }
    if (result) {
      query = query.eq('result', result);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (path) {
      query = query.ilike('file_path', `%${path}%`);
    }
    if (agent) {
      query = query.eq('agent_identifier', agent);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch logs',
      });
      return;
    }

    res.json({
      success: true,
      data: logs?.map((log) => ({
        id: log.id,
        filePath: log.file_path,
        operation: log.operation,
        result: log.result,
        agentIdentifier: log.agent_identifier,
        processName: log.process_name,
        matchedRuleId: log.matched_rule_id,
        metadata: log.metadata,
        createdAt: log.created_at,
      })) || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });
  }
);

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:scopeId/logs/stats
// ───────────────────────────────────────────────────────────────

router.get(
  '/stats',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { period = 'day' } = req.query;

    // Get date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const { data: logs, error } = await supabaseAdmin
      .from('access_logs')
      .select('operation, result, created_at')
      .eq('scope_id', scopeId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      });
      return;
    }

    // Calculate stats
    const total = logs?.length || 0;
    const allowed = logs?.filter((l) => l.result === 'allowed').length || 0;
    const blocked = logs?.filter((l) => l.result === 'blocked').length || 0;
    const warnings = logs?.filter((l) => l.result === 'warning').length || 0;

    // Operations breakdown
    const operations: Record<string, number> = {};
    for (const log of logs || []) {
      operations[log.operation] = (operations[log.operation] || 0) + 1;
    }

    // Hourly breakdown (for charts)
    const hourly: Record<string, { allowed: number; blocked: number; warnings: number }> = {};
    for (const log of logs || []) {
      const hour = new Date(log.created_at).toISOString().slice(0, 13) + ':00:00Z';
      if (!hourly[hour]) {
        hourly[hour] = { allowed: 0, blocked: 0, warnings: 0 };
      }
      if (log.result === 'allowed') hourly[hour].allowed++;
      else if (log.result === 'blocked') hourly[hour].blocked++;
      else if (log.result === 'warning') hourly[hour].warnings++;
    }

    res.json({
      success: true,
      data: {
        period,
        total,
        allowed,
        blocked,
        warnings,
        operations,
        hourly: Object.entries(hourly).map(([hour, stats]) => ({
          hour,
          ...stats,
        })),
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// GET /api/scopes/:scopeId/logs/export
// ───────────────────────────────────────────────────────────────

router.get(
  '/export',
  authenticate,
  requirePlan('pro', 'team', 'enterprise'),
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    let query = supabaseAdmin
      .from('access_logs')
      .select('*')
      .eq('scope_id', scopeId)
      .order('created_at', { ascending: false })
      .limit(10000); // Max export limit

    if (startDate) {
      query = query.gte('created_at', startDate as string);
    }
    if (endDate) {
      query = query.lte('created_at', endDate as string);
    }

    const { data: logs, error } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export logs',
      });
      return;
    }

    if (format === 'csv') {
      const csv = generateCSV(logs || []);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="access_logs.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: logs,
      });
    }
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/scopes/:scopeId/logs (for daemon to send logs)
// ───────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  validateParams(schemas.scopeIdParam),
  verifyScopeOwnership,
  async (req: AuthRequest, res: Response) => {
    const { scopeId } = req.params;
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Logs array is required',
      });
      return;
    }

    // Limit batch size
    if (logs.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum 100 logs per batch',
      });
      return;
    }

    const logsToInsert = logs.map((log: any) => ({
      scope_id: scopeId,
      file_path: log.filePath,
      operation: log.operation,
      result: log.result,
      matched_rule_id: log.matchedRuleId || null,
      agent_identifier: log.agentIdentifier || null,
      process_name: log.processName || null,
      process_pid: log.processPid || null,
      metadata: log.metadata || null,
    }));

    const { error } = await supabaseAdmin
      .from('access_logs')
      .insert(logsToInsert);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to save logs',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        saved: logs.length,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

function generateCSV(logs: any[]): string {
  const headers = [
    'id',
    'file_path',
    'operation',
    'result',
    'agent_identifier',
    'process_name',
    'created_at',
  ];

  const rows = logs.map((log) =>
    headers.map((h) => {
      const value = log[h];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default router;
