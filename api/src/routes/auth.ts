// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT AUTH ROUTES
// Registration, login, token refresh, API keys
// ═══════════════════════════════════════════════════════════════

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  authenticate,
  AuthRequest,
  signUpWithEmail,
  signInWithEmail,
  generateToken,
  generateRefreshToken,
  verifyToken,
  getUserById,
  hashApiKey,
} from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { supabaseAdmin } from '../db/supabase';

const router = Router();

// ───────────────────────────────────────────────────────────────
// POST /api/auth/register
// ───────────────────────────────────────────────────────────────

router.post(
  '/register',
  validate(schemas.register),
  async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await signUpWithEmail(email, password);

    if ('error' in result) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          plan: result.user.plan,
        },
        token: result.token,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/auth/login
// ───────────────────────────────────────────────────────────────

router.post(
  '/login',
  validate(schemas.login),
  async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await signInWithEmail(email, password);

    if ('error' in result) {
      res.status(401).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          plan: result.user.plan,
        },
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ───────────────────────────────────────────────────────────────

router.post(
  '/refresh',
  validate(schemas.refreshToken),
  async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    const payload = verifyToken(refreshToken);

    if (!payload || (payload as any).type !== 'refresh') {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
      return;
    }

    const user = await getUserById(payload.sub);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        token: generateToken(user),
        refreshToken: generateRefreshToken(user.id),
        expiresIn: 7 * 24 * 60 * 60,
      },
    });
  }
);

// ───────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ───────────────────────────────────────────────────────────────

router.post('/logout', authenticate, async (_req: AuthRequest, res: Response) => {
  // In a more complete implementation, you'd invalidate the token
  // by adding it to a blacklist or using short-lived tokens with refresh

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ───────────────────────────────────────────────────────────────
// GET /api/auth/me
// ───────────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error || !profile) {
    res.status(404).json({
      success: false,
      error: 'Profile not found',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      plan: profile.plan,
      createdAt: profile.created_at,
    },
  });
});

// ───────────────────────────────────────────────────────────────
// POST /api/auth/api-key
// ───────────────────────────────────────────────────────────────

router.post('/api-key', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, scopes } = req.body;

  // Generate a new API key with HMAC-SHA256 hash
  const apiKey = `sk_${uuidv4().replace(/-/g, '')}`;
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      user_id: req.user!.id,
      key_hash: keyHash,
      name: name || 'API Key',
      scopes: scopes || ['read', 'write'],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
    });
    return;
  }

  // Return the key only once - it won't be retrievable later
  res.status(201).json({
    success: true,
    data: {
      id: data.id,
      key: apiKey, // Only shown once!
      name: data.name,
      scopes: data.scopes,
      createdAt: data.created_at,
    },
    message: 'Save this API key - it will not be shown again',
  });
});

// ───────────────────────────────────────────────────────────────
// GET /api/auth/api-keys
// ───────────────────────────────────────────────────────────────

router.get('/api-keys', authenticate, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, scopes, is_active, created_at, last_used_at')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys',
    });
    return;
  }

  res.json({
    success: true,
    data: data.map((key) => ({
      id: key.id,
      name: key.name,
      scopes: key.scopes,
      isActive: key.is_active,
      createdAt: key.created_at,
      lastUsedAt: key.last_used_at,
    })),
  });
});

// ───────────────────────────────────────────────────────────────
// DELETE /api/auth/api-key/:id
// ───────────────────────────────────────────────────────────────

router.delete('/api-key/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key',
    });
    return;
  }

  res.json({
    success: true,
    message: 'API key deleted',
  });
});

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default router;
