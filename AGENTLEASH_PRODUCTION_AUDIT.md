# AGENTLEASH PRODUCTION READINESS AUDIT

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION AUDIT CHECKLIST                                     │
│  AgentLeash - AI Agent Permission Controller                    │
│  Run this audit before every production deployment              │
└─────────────────────────────────────────────────────────────────┘
```

## INSTRUCTIONS FOR CLAUDE CODE

Before declaring AgentLeash production-ready, systematically verify each item below. Mark items as:
- [x] PASS - Verified working correctly
- [ ] FAIL - Needs fix before launch
- [~] PARTIAL - Works but needs improvement (non-blocking)
- [N/A] - Not applicable to current release

Run all automated tests, then manually verify critical paths. Document any failures with specific details.

---

## 1. SECURITY AUDIT

### 1.1 Authentication & Authorization
- [ ] JWT tokens expire appropriately (recommended: 1 hour access, 7 day refresh)
- [ ] Refresh token rotation implemented
- [ ] API keys are hashed before storage (never plaintext)
- [ ] User can only access their own scopes (RLS policies active)
- [ ] Admin endpoints protected with role checks
- [ ] Rate limiting active on auth endpoints (max 5 attempts/minute)
- [ ] Password requirements enforced (if applicable)
- [ ] Session invalidation works on logout

### 1.2 Input Validation
- [ ] All API inputs sanitized and validated
- [ ] Path patterns validated against injection attacks
- [ ] Glob patterns cannot escape base_path (no ../ traversal)
- [ ] SQL injection prevented (parameterized queries only)
- [ ] XSS prevented in dashboard (all user content escaped)
- [ ] File paths normalized before rule matching
- [ ] Maximum input lengths enforced (path: 1000 chars, name: 100 chars)

### 1.3 Secrets & Configuration
- [ ] No hardcoded secrets in codebase
- [ ] .env.example contains all required variables (no values)
- [ ] Production secrets stored in secure vault (not git)
- [ ] API keys rotatable without downtime
- [ ] Database connection strings use SSL
- [ ] CORS configured for production domains only

### 1.4 Data Protection
- [ ] Sensitive logs redacted (no full file contents logged)
- [ ] PII handling compliant (user emails encrypted at rest)
- [ ] Audit logs immutable (append-only, no deletions)
- [ ] Data retention policies implemented
- [ ] Export functionality excludes sensitive system data

---

## 2. DATABASE AUDIT

### 2.1 Schema Integrity
- [ ] All tables have primary keys
- [ ] Foreign key constraints active (scopes -> users, rules -> scopes, etc.)
- [ ] Indexes exist on frequently queried columns:
  - [ ] access_logs.scope_id + created_at
  - [ ] access_logs.file_path
  - [ ] scope_rules.scope_id + priority
  - [ ] violations.scope_id + severity
- [ ] UUID generation working (gen_random_uuid())
- [ ] Timestamps auto-populate (created_at, updated_at)

### 2.2 Row Level Security
- [ ] RLS enabled on all user-facing tables
- [ ] Policies tested: user A cannot see user B's data
- [ ] Service role bypasses RLS (for background jobs)
- [ ] Policies cover SELECT, INSERT, UPDATE, DELETE

### 2.3 Migrations
- [ ] All migrations reversible
- [ ] Migration order documented
- [ ] No destructive migrations without data backup plan
- [ ] Seed data separate from migrations

### 2.4 Performance
- [ ] Query execution plans reviewed for N+1 issues
- [ ] access_logs table partitioned by date (if >1M rows expected)
- [ ] Old logs archival/deletion job scheduled
- [ ] Connection pooling configured (recommended: 10-20 connections)

---

## 3. API AUDIT

### 3.1 Endpoints Functional
- [ ] POST /api/auth/register - Creates user account
- [ ] POST /api/auth/login - Returns JWT tokens
- [ ] POST /api/auth/refresh - Rotates tokens
- [ ] GET /api/scopes - Lists user's scopes
- [ ] POST /api/scopes - Creates new scope
- [ ] GET /api/scopes/:id - Returns scope details
- [ ] PUT /api/scopes/:id - Updates scope
- [ ] DELETE /api/scopes/:id - Soft deletes scope
- [ ] GET /api/scopes/:id/rules - Lists rules for scope
- [ ] POST /api/scopes/:id/rules - Creates rule
- [ ] PUT /api/rules/:id - Updates rule
- [ ] DELETE /api/rules/:id - Deletes rule
- [ ] GET /api/scopes/:id/logs - Returns access logs (paginated)
- [ ] GET /api/scopes/:id/violations - Returns violations
- [ ] POST /api/scopes/:id/test - Tests path against rules
- [ ] WebSocket /ws/scopes/:id - Real-time log stream

### 3.2 Error Handling
- [ ] All endpoints return consistent error format:
  ```json
  { "error": { "code": "SCOPE_NOT_FOUND", "message": "..." } }
  ```
- [ ] 400 for validation errors (with field details)
- [ ] 401 for authentication failures
- [ ] 403 for authorization failures
- [ ] 404 for missing resources
- [ ] 429 for rate limit exceeded
- [ ] 500 errors logged with stack trace (not exposed to client)

### 3.3 Rate Limiting
- [ ] Global rate limit: 100 requests/minute per user
- [ ] Log ingestion rate limit: 1000 events/minute per scope
- [ ] WebSocket message rate limit: 100 messages/second
- [ ] Rate limit headers present (X-RateLimit-Remaining, etc.)

### 3.4 Response Quality
- [ ] All responses include appropriate Cache-Control headers
- [ ] Pagination implemented (limit, offset, total_count)
- [ ] Large responses gzipped
- [ ] Sensitive fields excluded from responses (password hashes, etc.)

---

## 4. DAEMON AUDIT

### 4.1 File Watcher
- [ ] chokidar initialized with correct options:
  - [ ] persistent: true
  - [ ] ignoreInitial: true (don't log existing files on start)
  - [ ] awaitWriteFinish: true (for large files)
  - [ ] ignored: node_modules, .git, etc.
- [ ] Handles all events: add, change, unlink, addDir, unlinkDir
- [ ] Graceful shutdown on SIGTERM/SIGINT
- [ ] Reconnects after temporary failures
- [ ] Memory usage stable under high file activity

### 4.2 Rule Evaluation
- [ ] Glob patterns match correctly (test suite passes)
- [ ] Priority ordering works (specific > general)
- [ ] Deny rules override allow rules at same priority
- [ ] Agent-specific rules override global rules
- [ ] Default policy (allow/deny) applied when no rules match
- [ ] Rule evaluation <1ms per file operation

### 4.3 Log Batching
- [ ] Logs batched before API submission (recommended: 100 events or 5 seconds)
- [ ] Batch failures retried with exponential backoff
- [ ] Local buffer prevents data loss during API outages
- [ ] Buffer size capped to prevent memory exhaustion

### 4.4 Violation Detection
- [ ] Mass delete detected (>10 files/minute threshold)
- [ ] Sensitive path access flagged (.env, credentials, keys)
- [ ] Config file modifications tracked
- [ ] Violation severity calculated correctly (low/medium/high/critical)

---

## 5. CLI AUDIT

### 5.1 Commands Functional
- [ ] leash init - Creates .agentleash.yml interactively
- [ ] leash watch - Starts daemon with live terminal UI
- [ ] leash status - Shows current scope status
- [ ] leash logs - Displays recent access logs
- [ ] leash logs --export - Exports to CSV
- [ ] leash allow <pattern> - Adds allow rule
- [ ] leash deny <pattern> - Adds deny rule
- [ ] leash test <path> - Tests path against rules
- [ ] leash login - Authenticates with API
- [ ] leash sync - Syncs local config with cloud

### 5.2 Terminal UI
- [ ] Colors render correctly (respects NO_COLOR env var)
- [ ] Live log updates without flicker
- [ ] Keyboard shortcuts work (q=quit, p=pause, f=filter)
- [ ] Resizes gracefully on terminal resize
- [ ] Works in minimal terminals (no Unicode fallback)

### 5.3 Error Messages
- [ ] Missing config file: clear instructions to run init
- [ ] Invalid config: specific YAML error location
- [ ] API connection failure: retry instructions
- [ ] Permission denied: suggests running with correct privileges

---

## 6. DASHBOARD AUDIT

### 6.1 Pages Load
- [ ] Landing page renders (<2s LCP)
- [ ] Dashboard loads with scope list
- [ ] Scope detail page shows rules and logs
- [ ] Rule editor saves changes
- [ ] Log viewer paginates correctly
- [ ] Violation report displays all severities

### 6.2 Real-time Updates
- [ ] WebSocket connects on scope detail page
- [ ] New logs appear without refresh
- [ ] Connection status indicator accurate
- [ ] Reconnects automatically after disconnect
- [ ] No memory leaks on long sessions

### 6.3 Responsive Design
- [ ] Desktop (1920px) - Full layout
- [ ] Laptop (1366px) - Adjusted spacing
- [ ] Tablet (768px) - Stacked layout
- [ ] Mobile (375px) - Single column, readable

### 6.4 Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Screen reader announces dynamic updates
- [ ] No seizure-inducing animations

---

## 7. VAULTAGENT INTEGRATION AUDIT

### 7.1 Detection
- [ ] Detects VaultAgent installation via CLI
- [ ] Detects VaultAgent via shared Supabase org
- [ ] Shows integration prompt when detected

### 7.2 Session Linking
- [ ] Can link AgentLeash scope to VaultAgent vault
- [ ] Combined audit view shows both file + secret access
- [ ] Unlinking works without data loss

### 7.3 Auto-Protection
- [ ] When VaultAgent detected, auto-suggests deny rules for:
  - [ ] .env files
  - [ ] credentials directories
  - [ ] key files (*.pem, *.key)
- [ ] User can accept/reject suggestions

### 7.4 Bundle Billing
- [ ] Bundle pricing displayed ($20/mo for both)
- [ ] Upgrade flow works from either product
- [ ] Canceling one doesn't affect the other

---

## 8. DEPLOYMENT AUDIT

### 8.1 Build Process
- [ ] npm run build completes without errors
- [ ] No TypeScript errors (strict mode)
- [ ] No ESLint errors
- [ ] Bundle size acceptable (<500KB initial JS)
- [ ] Environment variables validated at build time

### 8.2 Infrastructure
- [ ] Vercel project configured (or alternative)
- [ ] Environment variables set in production
- [ ] Custom domain configured with SSL
- [ ] CDN caching rules appropriate
- [ ] Database connection limits set

### 8.3 Monitoring
- [ ] Error tracking active (Sentry or similar)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring active
- [ ] Alert thresholds set:
  - [ ] Error rate >1%
  - [ ] Response time >2s
  - [ ] Database connections >80%

### 8.4 Backup & Recovery
- [ ] Database backups scheduled (daily minimum)
- [ ] Backup restoration tested
- [ ] Rollback procedure documented
- [ ] Incident response plan exists

---

## 9. DOCUMENTATION AUDIT

### 9.1 User Documentation
- [ ] README covers installation and quick start
- [ ] Configuration reference complete (.agentleash.yml options)
- [ ] CLI command reference with examples
- [ ] FAQ addresses common issues
- [ ] Troubleshooting guide exists

### 9.2 API Documentation
- [ ] All endpoints documented with request/response examples
- [ ] Authentication flow explained
- [ ] WebSocket protocol documented
- [ ] Error codes listed with explanations
- [ ] Rate limits clearly stated

### 9.3 Developer Documentation
- [ ] Architecture overview diagram
- [ ] Local development setup guide
- [ ] Contributing guidelines
- [ ] Code style guide referenced
- [ ] Release process documented

---

## 10. TESTING AUDIT

### 10.1 Unit Tests
- [ ] Rule evaluation logic: >90% coverage
- [ ] Glob pattern matching: all edge cases
- [ ] Config parsing: valid and invalid inputs
- [ ] API input validation: boundary cases

### 10.2 Integration Tests
- [ ] API endpoints with database
- [ ] WebSocket connection lifecycle
- [ ] Authentication flows
- [ ] Rate limiting behavior

### 10.3 End-to-End Tests
- [ ] User signup -> create scope -> add rules -> view logs
- [ ] CLI init -> watch -> generate violations -> view in dashboard
- [ ] VaultAgent integration flow

### 10.4 Performance Tests
- [ ] 1000 file events/second sustained
- [ ] 100 concurrent WebSocket connections
- [ ] 10,000 rules evaluation speed
- [ ] Dashboard with 100,000 log entries

---

## 11. LEGAL & COMPLIANCE

### 11.1 Terms & Privacy
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent implemented (if applicable)
- [ ] Data processing agreement available (for enterprise)

### 11.2 Open Source
- [ ] LICENSE file present (if open source)
- [ ] Third-party licenses compatible
- [ ] Attribution requirements met

---

## FINAL CHECKLIST

Before deploying to production, confirm:

- [ ] All SECURITY items pass
- [ ] All DATABASE items pass
- [ ] All API items pass (or documented as future)
- [ ] All DAEMON items pass
- [ ] All CLI items pass
- [ ] All critical DASHBOARD items pass
- [ ] MONITORING active and alerting
- [ ] DOCUMENTATION sufficient for launch
- [ ] At least one full E2E test passing

---

## AUDIT LOG

| Date | Auditor | Version | Result | Notes |
|------|---------|---------|--------|-------|
| YYYY-MM-DD | Claude Code | 0.1.0 | PASS/FAIL | Initial audit |

---

```
┌─────────────────────────────────────────────────────────────────┐
│  "Ship when ready, not when rushed."                            │
│                                    - Veridian Manifesto         │
└─────────────────────────────────────────────────────────────────┘
```
