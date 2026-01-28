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

// Enforce JWT_SECRET in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
if (!process.env.JWT_SECRET) {
  console.warn('[Auth] WARNING: JWT_SECRET not set, using insecure default for development only');
}
const EFFECTIVE_JWT_SECRET: string = process.env.JWT_SECRET || 'development-secret-change-in-production';

const JWT_EXPIRES_IN = process.env.SESSION_DURATION || '7d';

// Secret for HMAC-based API key hashing (more secure than plain SHA256)
const API_KEY_SECRET = process.env.API_KEY_SECRET;
if (!API_KEY_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('API_KEY_SECRET environment variable is required in production');
}

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
    EFFECTIVE_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET) as JwtPayload;
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

export function hashApiKey(key: string): string {
  // Use HMAC-SHA256 with server secret for secure API key hashing
  // This prevents rainbow table attacks even if database is compromised
  const crypto = require('crypto');
  const secret = API_KEY_SECRET || 'dev-api-key-secret';
  return crypto.createHmac('sha256', secret).update(key).digest('hex');
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
