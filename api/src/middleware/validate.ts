// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT VALIDATION MIDDLEWARE
// Request validation using Zod
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// ───────────────────────────────────────────────────────────────
// VALIDATION MIDDLEWARE
// ───────────────────────────────────────────────────────────────

export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid request body',
      });
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
      });
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid URL parameters',
      });
    }
  };
}

// ───────────────────────────────────────────────────────────────
// COMMON SCHEMAS
// ───────────────────────────────────────────────────────────────

export const schemas = {
  // Auth
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  // Scopes
  createScope: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    basePath: z.string().min(1, 'Base path is required'),
    config: z.string().optional(), // YAML config string
  }),

  updateScope: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
  }),

  syncScope: z.object({
    configYaml: z.string().min(1, 'Config YAML is required'),
  }),

  // Rules
  createRule: z.object({
    pathPattern: z.string().min(1, 'Path pattern is required'),
    ruleType: z.enum(['allow', 'deny']),
    operations: z.array(z.enum(['read', 'write', 'delete', 'execute', 'list'])).min(1),
    priority: z.number().int().optional(),
    reason: z.string().max(500).optional(),
  }),

  updateRule: z.object({
    pathPattern: z.string().min(1).optional(),
    ruleType: z.enum(['allow', 'deny']).optional(),
    operations: z.array(z.enum(['read', 'write', 'delete', 'execute', 'list'])).min(1).optional(),
    priority: z.number().int().optional(),
    reason: z.string().max(500).optional(),
  }),

  bulkRules: z.object({
    rules: z.array(z.object({
      pathPattern: z.string().min(1),
      ruleType: z.enum(['allow', 'deny']),
      operations: z.array(z.enum(['read', 'write', 'delete', 'execute', 'list'])).min(1),
      priority: z.number().int().optional(),
      reason: z.string().max(500).optional(),
    })),
    mode: z.enum(['replace', 'merge']).default('merge'),
  }),

  testRule: z.object({
    filePath: z.string().min(1, 'File path is required'),
    operation: z.enum(['read', 'write', 'delete', 'execute', 'list']).default('read'),
  }),

  // Logs
  logsQuery: z.object({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
    offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
    operation: z.enum(['read', 'write', 'delete', 'execute', 'list']).optional(),
    result: z.enum(['allowed', 'blocked', 'warning']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    path: z.string().optional(),
    agent: z.string().optional(),
  }),

  // Violations
  acknowledgeViolation: z.object({
    note: z.string().max(1000).optional(),
  }),

  // UUID param
  uuidParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  scopeIdParam: z.object({
    scopeId: z.string().uuid('Invalid scope ID format'),
  }),

  ruleIdParam: z.object({
    scopeId: z.string().uuid('Invalid scope ID format'),
    ruleId: z.string().uuid('Invalid rule ID format'),
  }),
};

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default validate;
