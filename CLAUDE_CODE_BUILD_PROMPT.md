# SCOPEAGENT - COMPLETE CLAUDE CODE BUILD PROMPT
## AI Agent Permission Controller for Local Development

---

## OVERVIEW

**What You're Building:**
ScopeAgent is a developer-friendly, local-first permission controller for AI coding agents. While VaultAgent protects secrets FROM AI agents, ScopeAgent protects your SYSTEM from AI agents by controlling what paths, files, and operations they can access.

**Core Value Proposition:**
"AI agents are powerful, but they're also scary. ScopeAgent lets you define exactly what they can touch."

**Signature Color:** Amber/Gold `#d4a76a`

**The Stack:**
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL)
- CLI: Commander.js + Inquirer.js
- Frontend: Next.js 14 + Tailwind CSS
- Real-time: WebSockets for live access logs
- Payments: Stripe
- Hosting: Vercel (web) + Railway (API)

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SCOPEAGENT SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────┐  │
│   │   CONFIG LAYER    │    │   DAEMON PROCESS  │    │   DASHBOARD   │  │
│   │  .scopeagent.yml  │───▶│   (File Watcher)  │───▶│  (Real-time)  │  │
│   │  Path rules       │    │   Intercept ops   │    │  Access logs  │  │
│   │  Permissions      │    │   Log access      │    │  Violation    │  │
│   │  Allowlist/Deny   │    │   Block/Allow     │    │  Alerts       │  │
│   └───────────────────┘    └───────────────────┘    └───────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                        SUPABASE                                  │  │
│   │   - Scope Configs    - Access Logs    - Violation Reports       │  │
│   │   - Agent Sessions   - User Accounts  - Team Management         │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    CLI INTERFACE                                 │  │
│   │   scopeagent init    - Create config                            │  │
│   │   scopeagent watch   - Start daemon                             │  │
│   │   scopeagent status  - Show current scope                       │  │
│   │   scopeagent logs    - View access logs                         │  │
│   │   scopeagent allow   - Add path to allowlist                    │  │
│   │   scopeagent deny    - Add path to denylist                     │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA

Create this in Supabase SQL Editor:

```sql
-- ═══════════════════════════════════════════════════════════════
-- SCOPEAGENT DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  display_name VARCHAR(100),
  plan VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'team', 'enterprise'
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- SCOPES (permission boundary configurations)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_path TEXT NOT NULL, -- e.g., /Users/dev/projects/myapp
  is_active BOOLEAN DEFAULT true,
  config_hash VARCHAR(64), -- SHA256 of .scopeagent.yml for sync detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- SCOPE_RULES (individual path permission rules)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE scope_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  rule_type VARCHAR(20) NOT NULL, -- 'allow', 'deny', 'readonly', 'writeonly'
  path_pattern TEXT NOT NULL, -- glob pattern: src/**, *.env, etc.
  operations TEXT[] DEFAULT '{read,write,delete,execute}', -- allowed ops
  priority INTEGER DEFAULT 0, -- higher = evaluated first
  reason TEXT, -- why this rule exists
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- ACCESS_LOGS (every file operation attempt)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  session_id UUID, -- optional: link to agent session
  file_path TEXT NOT NULL,
  operation VARCHAR(20) NOT NULL, -- 'read', 'write', 'delete', 'execute', 'list'
  result VARCHAR(20) NOT NULL, -- 'allowed', 'blocked', 'warning'
  matched_rule_id UUID REFERENCES scope_rules(id),
  agent_identifier TEXT, -- 'claude-code', 'cursor', etc.
  process_name TEXT,
  process_pid INTEGER,
  metadata JSONB, -- extra context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- AGENT_SESSIONS (tracking active agent sessions)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  agent_name VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  total_operations INTEGER DEFAULT 0,
  blocked_operations INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- VIOLATION_REPORTS (summarized security events)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE violation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES agent_sessions(id),
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  violation_type VARCHAR(50) NOT NULL, -- 'path_breach', 'mass_delete', 'config_access', etc.
  description TEXT NOT NULL,
  affected_paths TEXT[],
  recommended_action TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- TEAM MANAGEMENT (for team/enterprise plans)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE team_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  UNIQUE(team_id, scope_id)
);

-- ───────────────────────────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────────────────────────
CREATE INDEX idx_scopes_user ON scopes(user_id);
CREATE INDEX idx_scope_rules_scope ON scope_rules(scope_id);
CREATE INDEX idx_scope_rules_priority ON scope_rules(scope_id, priority DESC);
CREATE INDEX idx_access_logs_scope ON access_logs(scope_id);
CREATE INDEX idx_access_logs_created ON access_logs(created_at DESC);
CREATE INDEX idx_access_logs_result ON access_logs(result);
CREATE INDEX idx_agent_sessions_scope ON agent_sessions(scope_id);
CREATE INDEX idx_agent_sessions_token ON agent_sessions(session_token);
CREATE INDEX idx_violation_reports_scope ON violation_reports(scope_id);
CREATE INDEX idx_violation_reports_severity ON violation_reports(severity);

-- ───────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Scopes: users can only access their own scopes
CREATE POLICY "Users can CRUD own scopes" ON scopes
  FOR ALL USING (auth.uid() = user_id);

-- Scope rules: via scope ownership
CREATE POLICY "Users can CRUD own scope rules" ON scope_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scopes WHERE scopes.id = scope_rules.scope_id AND scopes.user_id = auth.uid())
  );

-- Access logs: via scope ownership
CREATE POLICY "Users can view own access logs" ON access_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM scopes WHERE scopes.id = access_logs.scope_id AND scopes.user_id = auth.uid())
  );

-- Agent sessions: via scope ownership
CREATE POLICY "Users can manage own agent sessions" ON agent_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scopes WHERE scopes.id = agent_sessions.scope_id AND scopes.user_id = auth.uid())
  );

-- Violation reports: via scope ownership
CREATE POLICY "Users can view own violation reports" ON violation_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scopes WHERE scopes.id = violation_reports.scope_id AND scopes.user_id = auth.uid())
  );

-- ───────────────────────────────────────────────────────────────
-- TRIGGERS
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scopes_updated_at
  BEFORE UPDATE ON scopes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## PHASE 1: PROJECT SETUP (Day 1)

### Prompt 1.1 - Initialize Monorepo

```
Create a new monorepo project called "scopeagent" with the following structure:

/scopeagent
├── /api                    # Express.js API server
│   ├── /src
│   │   ├── /routes         # API endpoints
│   │   ├── /services       # Business logic
│   │   ├── /middleware     # Auth, validation, rate limiting
│   │   ├── /db             # Supabase connection
│   │   └── /utils          # Helpers
│   ├── package.json
│   └── tsconfig.json
├── /cli                    # Command line tool
│   ├── /src
│   │   ├── /commands       # Individual commands
│   │   └── /utils          # CLI helpers
│   ├── package.json
│   └── tsconfig.json
├── /daemon                 # File watcher daemon
│   ├── /src
│   │   ├── /watcher        # File system monitoring
│   │   ├── /evaluator      # Rule evaluation engine
│   │   └── /reporter       # Log and report generation
│   ├── package.json
│   └── tsconfig.json
├── /web                    # Next.js dashboard
│   ├── /app                # App router pages
│   ├── /components         # UI components
│   └── /lib                # Utilities
├── /shared                 # Shared types and utilities
│   ├── /types              # TypeScript interfaces
│   └── /constants          # Shared constants
├── package.json            # Root package.json with workspaces
├── .env.example
└── README.md

Initialize git repository.
Set up npm workspaces in root package.json.
Create .gitignore with standard Node.js ignores plus .env files.
```

### Prompt 1.2 - API Package Setup

```
Set up the /api package with these dependencies:

Production dependencies:
- express
- @supabase/supabase-js
- zod (validation)
- jsonwebtoken
- helmet (security headers)
- cors
- express-rate-limit
- ws (WebSockets)
- dotenv
- uuid

Dev dependencies:
- typescript
- @types/node
- @types/express
- @types/ws
- @types/uuid
- ts-node
- nodemon
- eslint
- prettier

Create tsconfig.json with strict mode.
Create .env.example with:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET
- PORT
- ALLOWED_ORIGINS
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

Set up npm scripts: dev, build, start, lint.
```

### Prompt 1.3 - Daemon Package Setup

```
Set up the /daemon package with these dependencies:

Production dependencies:
- chokidar (file watching)
- glob (pattern matching)
- yaml (config parsing)
- ws (WebSocket client)
- commander (CLI parsing)
- chalk (terminal colors)
- ora (spinners)
- boxen (terminal boxes)
- dotenv

Dev dependencies:
- typescript
- @types/node
- @types/ws
- ts-node
- nodemon

The daemon will:
1. Watch file system operations in the scope's base path
2. Evaluate each operation against scope rules
3. Log all access attempts
4. Block or warn based on rules
5. Send real-time updates via WebSocket to dashboard

Create the main entry point that:
- Loads .scopeagent.yml from current directory
- Connects to API for rule sync
- Starts file watcher
- Opens WebSocket for real-time updates
```

---

## PHASE 2: CORE DAEMON (Days 2-3)

### Prompt 2.1 - Config Parser

```
Create the config parser in /daemon/src/config/parser.ts:

The .scopeagent.yml format:

```yaml
# .scopeagent.yml
version: 1
name: "my-project-scope"

# Base directory (defaults to current directory)
base_path: .

# Default behavior for unlisted paths
default_policy: deny  # 'allow' or 'deny'

# Global rules (apply to all agents)
rules:
  # Allow source code access
  - path: "src/**"
    allow: [read, write]
    
  # Allow reading configs but not writing
  - path: "*.config.js"
    allow: [read]
    deny: [write, delete]
    
  # Completely block sensitive files
  - path: ".env*"
    deny: [read, write, delete]
    reason: "Environment files contain secrets"
    
  # Block certain directories entirely
  - path: "node_modules/**"
    deny: [write, delete]
    allow: [read]
    
  # Block system files
  - path: ".*"
    deny: [read, write, delete]
    except: [.scopeagent.yml, .gitignore]
    
# Agent-specific overrides
agents:
  claude-code:
    # Additional restrictions for Claude Code
    rules:
      - path: "**/*.key"
        deny: [read]
  cursor:
    # Cursor-specific rules
    rules:
      - path: "tests/**"
        allow: [read, write, delete]

# Alerts configuration
alerts:
  # Notify on these violation types
  notify_on:
    - config_access
    - mass_delete
    - path_breach
  # Webhook for notifications (optional)
  webhook_url: null
```

Functions needed:
1. parseConfig(filePath: string): ScopeConfig
2. validateConfig(config: unknown): ValidationResult
3. watchConfigChanges(filePath: string, callback: (config: ScopeConfig) => void)
4. mergeAgentRules(globalRules: Rule[], agentRules: Rule[]): Rule[]

Include proper error messages for invalid configs.
Use Zod for validation schema.
```

### Prompt 2.2 - Rule Evaluator

```
Create the rule evaluation engine in /daemon/src/evaluator/engine.ts:

The evaluator determines if a file operation should be allowed.

Functions:

1. evaluateAccess(request: AccessRequest): AccessDecision
   interface AccessRequest {
     filePath: string;
     operation: 'read' | 'write' | 'delete' | 'execute' | 'list';
     agentIdentifier?: string;
     processName?: string;
     processPid?: number;
   }
   
   interface AccessDecision {
     allowed: boolean;
     reason: string;
     matchedRule?: Rule;
     severity?: 'info' | 'warning' | 'violation';
   }

2. matchPath(filePath: string, pattern: string): boolean
   - Support glob patterns: *, **, ?, [abc], {a,b}
   - Handle negation patterns: !pattern
   - Normalize paths for cross-platform

3. prioritizeRules(rules: Rule[]): Rule[]
   - More specific patterns take precedence
   - Explicit deny beats explicit allow
   - Agent-specific rules beat global rules
   - Later rules beat earlier rules (unless priority set)

4. detectSuspiciousPatterns(recentAccess: AccessLog[]): Violation[]
   - Mass file deletion (>10 files in 1 minute)
   - Accessing multiple .env files
   - Attempting to read SSH keys or credentials
   - Modifying system config files
   - Unusual access patterns

Include comprehensive tests for edge cases:
- Nested directories
- Symlinks
- Case sensitivity
- Unicode paths
```

### Prompt 2.3 - File Watcher

```
Create the file watcher in /daemon/src/watcher/index.ts:

Use chokidar for cross-platform file watching.

The watcher must:
1. Monitor all file system events in base_path
2. Filter events based on scope rules
3. Log all access attempts (allowed and blocked)
4. Send real-time updates to WebSocket
5. Handle high-frequency events (debounce/throttle)

Implementation:

```typescript
interface WatcherConfig {
  basePath: string;
  rules: Rule[];
  onAccess: (event: AccessEvent) => void;
  onViolation: (violation: Violation) => void;
}

class ScopeWatcher {
  private watcher: FSWatcher;
  private evaluator: RuleEvaluator;
  private recentAccess: AccessLog[] = [];
  
  start(): void;
  stop(): void;
  addRule(rule: Rule): void;
  removeRule(ruleId: string): void;
  getStats(): WatcherStats;
}
```

Events to watch:
- add: new file created
- change: file modified
- unlink: file deleted
- addDir: directory created
- unlinkDir: directory deleted

For each event:
1. Get the file path relative to base_path
2. Determine operation type
3. Evaluate against rules
4. Log the result
5. If blocked, optionally prevent the operation (if possible)
6. Emit real-time update

IMPORTANT: The watcher can't actually prevent file operations in most cases.
Instead, it:
- Logs and alerts on violations
- Can undo certain operations if configured (restore deleted files from backup)
- Provides real-time visibility

Include rate limiting for high-frequency events (e.g., build processes).
```

---

## PHASE 3: API SERVER (Days 4-5)

### Prompt 3.1 - Express Server Setup

```
Create the Express server in /api/src/index.ts:

Set up:
1. Helmet for security headers
2. CORS with configurable origins
3. Rate limiting (100 req/15min per IP)
4. JSON body parsing (10mb limit)
5. WebSocket server on same port
6. Error handling middleware
7. Request logging

Routes to mount:
- /api/auth - Authentication endpoints
- /api/scopes - Scope CRUD
- /api/rules - Rule management
- /api/sessions - Agent session management
- /api/logs - Access log queries
- /api/violations - Violation reports
- /api/webhooks - Stripe webhooks

Create health check endpoint at /health.

WebSocket endpoint at /ws for real-time updates.
```

### Prompt 3.2 - Authentication

```
Create auth routes in /api/src/routes/auth.ts:

Endpoints:

POST /api/auth/register
- Email/password registration
- Create Supabase auth user
- Auto-create profile
- Return JWT

POST /api/auth/login
- Email/password login
- Return JWT + refresh token

POST /api/auth/refresh
- Refresh expired JWT

POST /api/auth/logout
- Invalidate refresh token

POST /api/auth/api-key
- Generate API key for CLI/daemon
- Scoped to specific capabilities

DELETE /api/auth/api-key/:id
- Revoke API key

Create auth middleware in /api/src/middleware/auth.ts:
- JWT verification
- API key verification
- User extraction from token
- Optional auth (for public endpoints)
```

### Prompt 3.3 - Scopes CRUD

```
Create scope routes in /api/src/routes/scopes.ts:

Endpoints:

POST /api/scopes
- Create new scope
- Body: { name, description, basePath, config? }
- Parse and validate config if provided

GET /api/scopes
- List all user's scopes
- Include basic stats (rule count, recent access count)

GET /api/scopes/:id
- Get scope details
- Include rules and recent stats

PUT /api/scopes/:id
- Update scope metadata
- Can update name, description, isActive

DELETE /api/scopes/:id
- Soft delete scope
- Archive associated data

POST /api/scopes/:id/sync
- Sync rules from .scopeagent.yml
- Body: { configYaml: string }
- Parse, validate, update rules

GET /api/scopes/:id/export
- Export scope config as YAML
- For backup/sharing
```

### Prompt 3.4 - Rules Management

```
Create rules routes in /api/src/routes/rules.ts:

Endpoints:

POST /api/scopes/:scopeId/rules
- Add new rule to scope
- Body: { pathPattern, ruleType, operations, priority?, reason? }
- Validate pattern syntax

GET /api/scopes/:scopeId/rules
- List all rules for scope
- Sorted by priority

PUT /api/scopes/:scopeId/rules/:ruleId
- Update rule
- Can update all fields except scope_id

DELETE /api/scopes/:scopeId/rules/:ruleId
- Delete rule

POST /api/scopes/:scopeId/rules/test
- Test a path against current rules
- Body: { filePath, operation }
- Return: { allowed, matchedRule, reason }

POST /api/scopes/:scopeId/rules/bulk
- Bulk import rules
- Body: { rules: Rule[] }
- Replace or merge existing
```

### Prompt 3.5 - Access Logs & Violations

```
Create logs routes in /api/src/routes/logs.ts:

Endpoints:

GET /api/scopes/:scopeId/logs
- Query access logs
- Filters: operation, result, dateRange, path, agent
- Pagination: limit, offset
- Sort: created_at desc by default

GET /api/scopes/:scopeId/logs/stats
- Aggregated statistics
- Total operations, blocked count, top accessed paths
- Group by hour/day/week

GET /api/scopes/:scopeId/logs/export
- Export logs as CSV
- Date range filter
- For compliance/audit

Create violations routes in /api/src/routes/violations.ts:

GET /api/scopes/:scopeId/violations
- List violation reports
- Filters: severity, type, acknowledged, dateRange

POST /api/scopes/:scopeId/violations/:id/acknowledge
- Mark violation as acknowledged
- Body: { note?: string }

GET /api/scopes/:scopeId/violations/summary
- Violation summary by type/severity
- For dashboard overview
```

### Prompt 3.6 - WebSocket Handler

```
Create WebSocket handler in /api/src/ws/handler.ts:

The WebSocket provides real-time updates to the dashboard.

Protocol:

Client sends:
```json
{
  "type": "subscribe",
  "scopeId": "uuid",
  "token": "jwt"
}
```

Server sends:
```json
{
  "type": "access",
  "data": {
    "id": "uuid",
    "filePath": "/src/app.ts",
    "operation": "write",
    "result": "allowed",
    "timestamp": "2025-01-27T12:00:00Z"
  }
}
```

```json
{
  "type": "violation",
  "data": {
    "id": "uuid",
    "severity": "high",
    "type": "mass_delete",
    "description": "Attempted to delete 15 files in 30 seconds",
    "timestamp": "2025-01-27T12:00:00Z"
  }
}
```

```json
{
  "type": "stats",
  "data": {
    "activeOperations": 5,
    "blockedToday": 12,
    "totalToday": 156
  }
}
```

Implementation:
- Authenticate connection via JWT
- Subscribe to specific scope
- Broadcast events to all subscribed clients
- Handle reconnection gracefully
- Clean up on disconnect
- Rate limit broadcasts (batch if >10/sec)
```

---

## PHASE 4: CLI TOOL (Day 6)

### Prompt 4.1 - CLI Structure

```
Create the CLI in /cli/src/index.ts using Commander.js:

Commands:

scopeagent init [path]
- Create .scopeagent.yml in specified or current directory
- Interactive prompts for initial config
- Detect common project types (Node.js, Python, etc.)
- Generate sensible defaults

scopeagent login
- Authenticate with API
- Store token in ~/.scopeagent/credentials
- Support --api-key flag for CI/CD

scopeagent watch [path]
- Start the daemon watching specified path
- Default to current directory
- Show real-time access log in terminal
- Color-coded: green=allowed, yellow=warning, red=blocked

scopeagent status
- Show current scope info
- Active rules count
- Recent access summary
- Any pending violations

scopeagent logs [--limit N] [--operation TYPE] [--result TYPE]
- View recent access logs
- Filters for operation and result
- Default last 50 entries

scopeagent allow <pattern> [--operation TYPE]
- Quick add allow rule
- e.g., `scopeagent allow "tests/**" --operation write`

scopeagent deny <pattern> [--operation TYPE]
- Quick add deny rule
- e.g., `scopeagent deny ".env*"`

scopeagent test <path> [--operation TYPE]
- Test if a path would be allowed
- Show which rule matches

scopeagent sync
- Sync local .scopeagent.yml to cloud
- Or pull cloud config to local

Use chalk for colors, ora for spinners, inquirer for prompts.
Match the terminal aesthetic with box-drawing characters.
```

### Prompt 4.2 - Terminal UI for Watch Mode

```
Create the watch mode UI in /cli/src/commands/watch.ts:

The watch command should display a real-time terminal UI:

```
╔══════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                                          [WATCHING...]   ║
╠══════════════════════════════════════════════════════════════════════╣
║  Scope: my-project-scope                                             ║
║  Path:  /Users/dev/projects/myapp                                    ║
║  Rules: 15 active                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  RECENT ACTIVITY                                                     ║
║  ───────────────────────────────────────────────────────────────     ║
║  14:32:01  [/]  READ   src/components/Button.tsx                     ║
║  14:32:02  [/]  WRITE  src/components/Button.tsx                     ║
║  14:32:05  [X]  READ   .env.local                    [BLOCKED]       ║
║  14:32:08  [/]  READ   package.json                                  ║
║  14:32:10  [!]  DELETE node_modules/lodash/...       [WARNING]       ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  STATS                                                               ║
║  ───────────────────────────────────────────────────────────────     ║
║  Allowed: 142   Blocked: 3   Warnings: 7   Session: 45m              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  [q] Quit   [p] Pause   [c] Clear   [r] Rules   [h] Help
```

Color coding:
- Amber (#d4a76a) for headers and active elements
- Green/Mint for allowed operations
- Coral/Red for blocked operations
- Yellow for warnings
- Gray for timestamps and muted text

Use blessed or ink for the TUI, or implement with raw ANSI codes.
Handle terminal resize events.
Scroll through logs with arrow keys.
```

---

## PHASE 5: WEB DASHBOARD (Days 7-8)

### Prompt 5.1 - Next.js Setup

```
Set up the Next.js dashboard in /web:

Use Next.js 14 with App Router.
Use Tailwind CSS for styling.
NO shadcn/ui - implement custom components matching the Pastel Retro Terminal aesthetic.

Structure:
/app
  /page.tsx              - Landing page
  /login/page.tsx        - Auth page
  /dashboard/page.tsx    - Main dashboard
  /dashboard/scope/[id]/page.tsx - Scope detail
  /dashboard/scope/[id]/logs/page.tsx - Access logs
  /dashboard/scope/[id]/rules/page.tsx - Rule editor
  /dashboard/settings/page.tsx - User settings
  /pricing/page.tsx      - Pricing page
  /docs/page.tsx         - Documentation

/components
  /ui                    - Reusable UI components
    /Button.tsx
    /Input.tsx
    /Card.tsx
    /Table.tsx
    /Modal.tsx
    /Badge.tsx
    /Tabs.tsx
  /layout
    /Header.tsx
    /Sidebar.tsx
    /Footer.tsx
  /scope
    /ScopeCard.tsx
    /RuleEditor.tsx
    /AccessLog.tsx
    /ViolationAlert.tsx
  /charts
    /ActivityChart.tsx
    /OperationPieChart.tsx

/lib
  /supabase.ts          - Supabase client
  /api.ts               - API client
  /hooks.ts             - Custom hooks
  /utils.ts             - Utilities

Install: @supabase/supabase-js, @supabase/auth-helpers-nextjs, swr, recharts
```

### Prompt 5.2 - Pastel Retro Terminal Theme

```
Create the theme configuration in /web/lib/theme.ts:

```typescript
export const colors = {
  // Base
  bg: '#1a1a2e',
  bgLight: '#252542',
  bgCard: '#1f1f35',
  
  // Text
  text: '#e8e3e3',
  textMuted: '#6e6a86',
  
  // Accents
  amber: '#d4a76a',      // ScopeAgent primary
  mint: '#a8d8b9',       // Success/allowed
  coral: '#eb6f92',      // Error/blocked
  lavender: '#c4a7e7',   // Info/highlight
  cyan: '#7eb8da',       // Links/interactive
  cream: '#ffe9b0',      // Warnings
  
  // Borders
  border: '#6e6a86',
  borderLight: '#4a4a6a',
};

export const fonts = {
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
};
```

Create global CSS in /web/app/globals.css:
- Use monospace font everywhere
- No emojis
- Box-drawing characters for borders
- ASCII art for icons
- Blinking cursor effect for inputs
- Double-line borders (╔═╗) for premium/important sections
- Single-line borders (┌─┐) for standard sections
```

### Prompt 5.3 - Landing Page

```
Create the landing page at /web/app/page.tsx:

Follow the exact pattern from VaultAgent landing page:
1. ASCII logo for SCOPEAGENT in amber
2. Tagline: "AI agents are powerful. ScopeAgent keeps them in line."
3. Subtitle: // path boundaries, real-time monitoring, violation alerts
4. Three feature cards with ASCII art icons
5. How it works section with ASCII flow diagram
6. Pricing section
7. FAQ with expandable items
8. Footer with ASCII border

Feature cards:
1. [#] PATH BOUNDARIES - Define exactly what AI agents can access
2. [>] REAL-TIME MONITORING - See every file operation as it happens
3. [!] VIOLATION ALERTS - Get notified when agents go out of bounds

How it works:
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   1. DEFINE         2. WATCH           3. PROTECT                   │
│   ───────────       ───────────        ───────────                  │
│                                                                     │
│   Create your       Start the          Get alerts                   │
│   .scopeagent.yml   daemon with        when agents                  │
│   with path rules   one command        cross the line               │
│                                                                     │
│   $ scopeagent      $ scopeagent       [!] VIOLATION                │
│     init              watch            .env access blocked          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Pricing (match VaultAgent structure):
| Tier       | Scopes | Logs/day | Features              | Price   |
|------------|--------|----------|-----------------------|---------|
| Free       | 1      | 1,000    | Basic monitoring      | $0      |
| Pro        | 5      | 10,000   | Custom rules, Export  | $15/mo  |
| Team       | 20     | 100,000  | Team sharing, Webhooks| $49/mo  |
| Enterprise | ∞      | ∞        | SSO, Compliance       | $149/mo |
```

### Prompt 5.4 - Dashboard Main View

```
Create the dashboard at /web/app/dashboard/page.tsx:

Layout:
- Sidebar with scope list
- Main area with scope overview
- Real-time activity feed

Components:

ScopeSelector in sidebar:
```
┌─────────────────────────┐
│ MY SCOPES               │
├─────────────────────────┤
│ [*] my-project-scope    │
│ [ ] backend-api         │
│ [ ] mobile-app          │
├─────────────────────────┤
│ [+] New Scope           │
└─────────────────────────┘
```

Main dashboard:
```
╔══════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                               [DOCS]  [SETTINGS]  [PRO]  ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  SCOPE: my-project-scope                                             ║
║  PATH:  /Users/dev/projects/myapp                 [ACTIVE]           ║
║                                                                      ║
╠═══════════════════════════╦══════════════════════════════════════════╣
║  TODAY'S STATS            ║  RECENT ACTIVITY                         ║
║  ─────────────────────    ║  ───────────────────────────────────     ║
║                           ║                                          ║
║  Operations:  1,247       ║  14:32:01 [/] READ  src/app.ts           ║
║  Blocked:        23       ║  14:32:05 [X] READ  .env                 ║
║  Warnings:       12       ║  14:32:08 [/] WRITE src/app.ts           ║
║                           ║  14:32:10 [!] DELETE package-lock.json   ║
║  ┌─────────────────┐      ║                                          ║
║  │ ████████░░ 98%  │      ║  [View All Logs →]                       ║
║  │ Operations OK   │      ║                                          ║
║  └─────────────────┘      ║                                          ║
║                           ║                                          ║
╠═══════════════════════════╩══════════════════════════════════════════╣
║  ACTIVE RULES (15)                              [EDIT RULES →]       ║
║  ─────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  [/] ALLOW  src/**            read, write                            ║
║  [X] DENY   .env*             read, write, delete                    ║
║  [X] DENY   **/*.key          read                                   ║
║  [~] WARN   node_modules/**   write, delete                          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

Include real-time updates via WebSocket.
Use SWR for data fetching with revalidation.
```

### Prompt 5.5 - Scope Detail & Logs

```
Create the scope detail page at /web/app/dashboard/scope/[id]/page.tsx:

Similar to dashboard but with more detail:
- Full stats breakdown
- Activity chart (last 24h)
- Rule list with edit capability
- Recent violations section

Create the logs page at /web/app/dashboard/scope/[id]/logs/page.tsx:

Full access log viewer:
```
╔══════════════════════════════════════════════════════════════════════╗
║  ACCESS LOGS                                          [EXPORT CSV]   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  FILTERS                                                             ║
║  ─────────────────────────────────────────────────────────────────   ║
║  Operation: [ALL     ▼]  Result: [ALL     ▼]  Date: [TODAY    ▼]    ║
║  Path filter: [_______________________________]                      ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  TIME        RESULT  OP      PATH                         AGENT      ║
║  ─────────────────────────────────────────────────────────────────   ║
║  14:32:01    [/]     READ    src/components/Button.tsx   claude-code ║
║  14:32:02    [/]     WRITE   src/components/Button.tsx   claude-code ║
║  14:32:05    [X]     READ    .env.local                  claude-code ║
║  14:32:08    [/]     READ    package.json                claude-code ║
║  14:32:10    [!]     DELETE  node_modules/lodash/...     cursor      ║
║                                                                      ║
║  ─────────────────────────────────────────────────────────────────   ║
║  [<< Prev]                    Page 1 of 47                [Next >>]  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

Features:
- Infinite scroll or pagination
- Click on row for full details modal
- Filter by multiple criteria
- Export to CSV
- Real-time append of new logs
```

### Prompt 5.6 - Rule Editor

```
Create the rule editor at /web/app/dashboard/scope/[id]/rules/page.tsx:

Interactive rule editor:
```
╔══════════════════════════════════════════════════════════════════════╗
║  RULE EDITOR                                          [SAVE RULES]   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  DEFAULT POLICY: [DENY ▼]  (what happens for unmatched paths)        ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  RULES (evaluated top to bottom, first match wins)                   ║
║  ─────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  1. ┌──────────────────────────────────────────────────────────────┐ ║
║     │ Type: [ALLOW ▼]  Path: [src/**________________]              │ ║
║     │ Operations: [x] read  [x] write  [ ] delete  [ ] execute     │ ║
║     │ Reason: [Source code access_____________________]            │ ║
║     │                                    [↑] [↓] [TEST] [DELETE]   │ ║
║     └──────────────────────────────────────────────────────────────┘ ║
║                                                                      ║
║  2. ┌──────────────────────────────────────────────────────────────┐ ║
║     │ Type: [DENY  ▼]  Path: [.env*_________________]              │ ║
║     │ Operations: [x] read  [x] write  [x] delete  [ ] execute     │ ║
║     │ Reason: [Environment files contain secrets___]               │ ║
║     │                                    [↑] [↓] [TEST] [DELETE]   │ ║
║     └──────────────────────────────────────────────────────────────┘ ║
║                                                                      ║
║  [+ ADD RULE]                                                        ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  TEST RULE                                                           ║
║  ─────────────────────────────────────────────────────────────────   ║
║  Path: [src/app.ts____________]  Op: [read ▼]  [TEST]               ║
║                                                                      ║
║  Result: [/] ALLOWED by rule #1 (src/**)                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

Features:
- Drag-and-drop reordering
- Inline editing
- Test path against rules
- Import/Export YAML
- Undo/Redo
```

---

## PHASE 6: VAULTAGENT INTEGRATION (Day 9)

### Prompt 6.1 - VaultAgent Integration

```
Create VaultAgent integration in /daemon/src/integrations/vaultagent.ts:

ScopeAgent should integrate with VaultAgent for a complete "AI Agent Security Stack":

1. Automatic .env protection
   - If VaultAgent is detected, automatically add deny rules for all secret paths
   - Read VaultAgent config to find secret locations

2. Session linking
   - When creating a ScopeAgent session, optionally link to VaultAgent session
   - Combined audit log showing both file access and secret access

3. Cross-product dashboard
   - If user has both products, show unified security dashboard
   - Combined violation alerts

Implementation:

```typescript
interface VaultAgentIntegration {
  // Check if VaultAgent is configured
  detectVaultAgent(): Promise<boolean>;
  
  // Get paths that VaultAgent protects
  getProtectedPaths(): Promise<string[]>;
  
  // Link sessions
  linkSession(scopeSessionId: string, vaultSessionId: string): Promise<void>;
  
  // Get combined audit logs
  getCombinedAuditLogs(startDate: Date, endDate: Date): Promise<CombinedLog[]>;
}
```

Add CLI commands:
- scopeagent link-vault - Link to VaultAgent account
- scopeagent status --vault - Show combined status
```

### Prompt 6.2 - Bundle Pricing API

```
Create bundle pricing endpoints in /api/src/routes/bundles.ts:

Endpoints:

GET /api/bundles
- List available bundles
- VaultAgent + ScopeAgent Pro: $20/mo (save $4)
- VaultAgent + ScopeAgent Team: $70/mo (save $8)

POST /api/bundles/subscribe
- Subscribe to a bundle
- Create Stripe subscription with multiple products
- Apply bundle discount

GET /api/bundles/upgrade
- Show upgrade options for current subscription
- Calculate prorated amounts

The bundles should be marketed as:
"AI Agent Security Stack"
- VaultAgent: Protect secrets FROM agents
- ScopeAgent: Protect systems FROM agents
- Together: Complete AI agent security
```

---

## PHASE 7: TESTING & LAUNCH (Day 10)

### Prompt 7.1 - Testing

```
Add comprehensive tests:

/api/src/__tests__/:
- auth.test.ts - Registration, login, API keys
- scopes.test.ts - CRUD operations
- rules.test.ts - Rule evaluation
- logs.test.ts - Log queries
- ws.test.ts - WebSocket handling

/daemon/src/__tests__/:
- config.test.ts - YAML parsing
- evaluator.test.ts - Rule matching (edge cases!)
- watcher.test.ts - File event handling

/cli/src/__tests__/:
- commands.test.ts - CLI command parsing
- output.test.ts - Terminal output formatting

Key test cases for evaluator:
- Glob pattern matching: *, **, ?, [abc]
- Nested directories: src/components/Button.tsx vs src/**
- Exact matches vs patterns
- Priority ordering
- Agent-specific overrides
- Symlink handling
- Unicode paths
- Case sensitivity (platform-dependent)

Use Jest for all tests.
Aim for >80% coverage on critical paths.
```

### Prompt 7.2 - Documentation

```
Create documentation:

README.md:
- Project overview
- Quick start (5-minute setup)
- Installation instructions
- Basic usage examples

SECURITY.md:
- Security model
- What ScopeAgent can/cannot prevent
- Best practices

CONFIG.md:
- Complete .scopeagent.yml reference
- All options documented
- Example configs for common setups

API.md:
- All endpoints documented
- Authentication explained
- WebSocket protocol

CLI.md:
- All commands with examples
- Configuration options
- Integration guides
```

### Prompt 7.3 - Deployment

```
Create deployment configuration:

Docker:
- Dockerfile for API
- Dockerfile for daemon (for server-side use)
- docker-compose.yml for local development

Vercel (web):
- vercel.json
- Environment variables list

Railway (API):
- railway.toml
- Procfile

NPM (CLI):
- Package configuration for npm publish
- Binary entry point

CI/CD:
- GitHub Actions workflow
- Run tests on PR
- Deploy on merge to main
- Publish CLI to npm on tag
```

---

## PRODUCT HUNT LAUNCH COPY

### Tagline (60 chars)
**"AI agents are powerful. ScopeAgent keeps them in line."**

### Description (260 chars)
Define path boundaries for AI coding agents. See every file operation in real-time. Get alerts when agents try to access sensitive files. Works with Claude Code, Cursor, and any AI tool. The missing security layer for AI-assisted development.

### First Comment (Maker's Comment)
Hey Product Hunt!

I built ScopeAgent because I kept having this paranoid feeling while using AI coding agents: "Wait, can Claude Code read my .env file right now? Did Cursor just try to delete my node_modules?"

The problem: AI agents are incredibly powerful, but you have zero visibility into what they're actually doing with your file system.

The solution: ScopeAgent lets you define exactly what paths agents can access, monitors every file operation in real-time, and alerts you when something looks suspicious.

It pairs perfectly with VaultAgent (which protects secrets FROM agents) - together they form a complete AI Agent Security Stack.

Free tier available. Would love your feedback!

---

## CROSS-SELLING OPPORTUNITIES

1. **Landing Page**: "Pairs with VaultAgent" section
2. **Dashboard**: "Complete your security stack" upsell if they don't have VaultAgent
3. **CLI**: `scopeagent status` shows "Tip: Add VaultAgent for secret protection"
4. **Bundle Discount**: 15% off when buying both
5. **Combined Dashboard**: Unified view if they have both products

---

## FILE STRUCTURE SUMMARY

After completing all prompts, you should have:

```
/scopeagent
├── /api
│   ├── /src
│   │   ├── /routes
│   │   │   ├── auth.ts
│   │   │   ├── scopes.ts
│   │   │   ├── rules.ts
│   │   │   ├── logs.ts
│   │   │   ├── violations.ts
│   │   │   └── bundles.ts
│   │   ├── /services
│   │   ├── /middleware
│   │   ├── /db
│   │   ├── /ws
│   │   └── index.ts
│   └── package.json
├── /cli
│   ├── /src
│   │   ├── /commands
│   │   │   ├── init.ts
│   │   │   ├── watch.ts
│   │   │   ├── status.ts
│   │   │   ├── logs.ts
│   │   │   ├── allow.ts
│   │   │   ├── deny.ts
│   │   │   ├── test.ts
│   │   │   └── sync.ts
│   │   └── index.ts
│   └── package.json
├── /daemon
│   ├── /src
│   │   ├── /config
│   │   ├── /evaluator
│   │   ├── /watcher
│   │   ├── /integrations
│   │   └── index.ts
│   └── package.json
├── /web
│   ├── /app
│   │   ├── page.tsx
│   │   ├── /login
│   │   ├── /dashboard
│   │   ├── /pricing
│   │   └── /docs
│   ├── /components
│   └── /lib
├── /shared
│   ├── /types
│   └── /constants
├── package.json
├── README.md
├── SECURITY.md
├── CONFIG.md
└── .env.example
```

---

## ESTIMATED BUILD TIME

- Phase 1 (Setup): 2-3 hours
- Phase 2 (Daemon): 6-8 hours
- Phase 3 (API): 6-8 hours
- Phase 4 (CLI): 4-6 hours
- Phase 5 (Dashboard): 8-10 hours
- Phase 6 (Integration): 2-3 hours
- Phase 7 (Testing/Launch): 4-6 hours

**Total: 32-44 hours (~1 week full-time)**

---

*ScopeAgent Build Prompt v1.0*
*Pastel Retro Terminal Design System*
*Primary Color: Amber #d4a76a*
