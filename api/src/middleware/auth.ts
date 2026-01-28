// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT AUTH MIDDLEWARE
// JWT and API key authentication
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { supabase, supabaseAdmin, DbProfile } from '../db/supabase';

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  plan: DbProfile['plan'];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  token?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  plan: string;
  iat: number;
  exp: number;
}

// ───────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.SESSION_DURATION || '7d';

// ───────────────────────────────────────────────────────────────
// JWT FUNCTIONS
// ───────────────────────────────────────────────────────────────

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      plan: user.plan,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ───────────────────────────────────────────────────────────────

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
    return;
  }

  // Check for Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      plan: payload.plan as DbProfile['plan'],
    };
    req.token = token;
    next();
    return;
  }

  // Check for API key
  if (authHeader.startsWith('ApiKey ')) {
    const apiKey = authHeader.substring(7);
    validateApiKey(apiKey)
      .then((user) => {
        if (!user) {
          res.status(401).json({
            success: false,
            error: 'Invalid API key',
          });
          return;
        }
        req.user = user;
        next();
      })
      .catch(() => {
        res.status(401).json({
          success: false,
          error: 'Failed to validate API key',
        });
      });
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Invalid authorization format. Use "Bearer <token>" or "ApiKey <key>"',
  });
}

// ───────────────────────────────────────────────────────────────
// OPTIONAL AUTH MIDDLEWARE
// ───────────────────────────────────────────────────────────────

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        plan: payload.plan as DbProfile['plan'],
      };
      req.token = token;
    }
  }

  next();
}

// ───────────────────────────────────────────────────────────────
// PLAN CHECK MIDDLEWARE
// ───────────────────────────────────────────────────────────────

export function requirePlan(...allowedPlans: DbProfile['plan'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedPlans.includes(req.user.plan)) {
      res.status(403).json({
        success: false,
        error: `This feature requires one of the following plans: ${allowedPlans.join(', ')}`,
      });
      return;
    }

    next();
  };
}

// ───────────────────────────────────────────────────────────────
// API KEY VALIDATION
// ───────────────────────────────────────────────────────────────

async function validateApiKey(apiKey: string): Promise<AuthUser | null> {
  // API keys are stored as hashed values in a separate table
  // For now, we'll use a simple lookup
  // In production, you'd hash the key and compare

  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, scopes')
      .eq('key_hash', hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user_id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      plan: profile.plan,
    };
  } catch {
    return null;
  }
}

function hashApiKey(key: string): string {
  // Simple hash for API key comparison
  // In production, use a proper hashing algorithm like bcrypt
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(key).digest('hex');
}

// ───────────────────────────────────────────────────────────────
// SUPABASE AUTH HELPERS
// ───────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Failed to create user' };
  }

  // Get profile (created by trigger)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Failed to get user profile' };
  }

  const user: AuthUser = {
    id: profile.id,
    email: profile.email,
    plan: profile.plan,
  };

  return {
    user,
    token: generateToken(user),
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string; refreshToken: string } | { error: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Failed to sign in' };
  }

  // Get profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Failed to get user profile' };
  }

  const user: AuthUser = {
    id: profile.id,
    email: profile.email,
    plan: profile.plan,
  };

  return {
    user,
    token: generateToken(user),
    refreshToken: generateRefreshToken(user.id),
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    plan: profile.plan,
  };
}

// ───────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────

export default authenticate;
