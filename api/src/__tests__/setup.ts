// ═══════════════════════════════════════════════════════════════
// TEST SETUP
// Common test configuration and mocks
// ═══════════════════════════════════════════════════════════════

import { jest } from '@jest/globals';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.NODE_ENV = 'test';

// Increase timeout for async tests
jest.setTimeout(10000);

// Mock Supabase client
jest.mock('../db/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    },
  },
  checkConnection: jest.fn(() => Promise.resolve(true)),
}));

// Global test utilities
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = (): jest.Mock => jest.fn();

// Test user data
export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  plan: 'pro',
};

// Test scope data
export const TEST_SCOPE = {
  id: 'test-scope-id',
  user_id: 'test-user-id',
  name: 'test-scope',
  description: 'Test scope description',
  base_path: '/test/path',
  default_policy: 'deny',
  is_active: true,
  created_at: new Date().toISOString(),
};

// Test rule data
export const TEST_RULE = {
  id: 'test-rule-id',
  scope_id: 'test-scope-id',
  path_pattern: 'src/**',
  rule_type: 'allow',
  operations: ['read', 'write'],
  priority: 0,
  reason: 'Test rule',
  created_at: new Date().toISOString(),
};
