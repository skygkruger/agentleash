# API Reference

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT API REFERENCE                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  REST API and WebSocket documentation                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Base URL

- **Production**: `https://api.scopeagent.io`
- **Local Development**: `http://localhost:3001`

## Authentication

### JWT Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained via the login endpoint and expire after 1 hour.

### API Key Authentication

For CLI and automated tools, use an API key:

```
Authorization: Bearer sa_<your-api-key>
```

API keys don't expire but can be revoked.

---

## Endpoints

### Authentication

#### POST /api/auth/register
Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "plan": "free"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /api/auth/login
Authenticate and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "plan": "pro"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /api/auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

#### GET /api/auth/me
Get current user info. Requires authentication.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "pro"
  }
}
```

#### POST /api/auth/api-key
Create a new API key.

**Request:**
```json
{
  "name": "my-cli-key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "sa_abc123..."
  }
}
```

> **Note:** The key is only shown once. Store it securely.

#### GET /api/auth/api-keys
List all API keys (keys are masked).

#### DELETE /api/auth/api-key/:id
Revoke an API key.

---

### Scopes

#### GET /api/scopes
List all scopes for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "my-project",
      "description": "My project scope",
      "basePath": "/Users/dev/projects/myapp",
      "defaultPolicy": "deny",
      "isActive": true,
      "createdAt": "2025-01-27T12:00:00Z",
      "lastSyncedAt": "2025-01-27T14:00:00Z"
    }
  ]
}
```

#### POST /api/scopes
Create a new scope.

**Request:**
```json
{
  "name": "my-project",
  "description": "Optional description",
  "basePath": "/Users/dev/projects/myapp",
  "defaultPolicy": "deny"
}
```

#### GET /api/scopes/:id
Get scope details.

#### PUT /api/scopes/:id
Update a scope.

**Request:**
```json
{
  "name": "updated-name",
  "description": "Updated description",
  "defaultPolicy": "allow",
  "isActive": true
}
```

#### DELETE /api/scopes/:id
Delete a scope (soft delete).

#### POST /api/scopes/:id/sync
Sync configuration from CLI.

**Request:**
```json
{
  "configYaml": "version: 1\nname: my-scope\n..."
}
```

#### GET /api/scopes/:id/export
Export scope configuration as YAML.

---

### Rules

#### GET /api/scopes/:scopeId/rules
List all rules for a scope.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pathPattern": "src/**",
      "ruleType": "allow",
      "operations": ["read", "write"],
      "priority": 10,
      "reason": "Source code access",
      "createdAt": "2025-01-27T12:00:00Z"
    }
  ]
}
```

#### POST /api/scopes/:scopeId/rules
Create a new rule.

**Request:**
```json
{
  "pathPattern": "src/**/*.ts",
  "ruleType": "allow",
  "operations": ["read", "write"],
  "priority": 10,
  "reason": "TypeScript source files"
}
```

#### PUT /api/scopes/:scopeId/rules/:ruleId
Update a rule.

#### DELETE /api/scopes/:scopeId/rules/:ruleId
Delete a rule.

#### POST /api/scopes/:scopeId/rules/test
Test a path against rules.

**Request:**
```json
{
  "filePath": "src/app.ts",
  "operation": "read"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "src/app.ts",
    "operation": "read",
    "allowed": true,
    "reason": "Matched rule: src/**",
    "matchedRule": {
      "id": "uuid",
      "pathPattern": "src/**",
      "ruleType": "allow"
    }
  }
}
```

#### POST /api/scopes/:scopeId/rules/bulk
Bulk import rules.

**Request:**
```json
{
  "rules": [
    {
      "pathPattern": "src/**",
      "ruleType": "allow",
      "operations": ["read", "write"]
    },
    {
      "pathPattern": ".env*",
      "ruleType": "deny",
      "operations": ["read", "write", "delete"]
    }
  ],
  "mode": "replace"
}
```

---

### Access Logs

#### GET /api/scopes/:scopeId/logs
Query access logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max results (default 50, max 1000) |
| offset | number | Pagination offset |
| operation | string | Filter by operation |
| result | string | Filter by result (allowed/blocked/warning) |
| startDate | ISO date | Start of date range |
| endDate | ISO date | End of date range |

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "filePath": "src/app.ts",
        "operation": "read",
        "result": "allowed",
        "agentIdentifier": "claude-code",
        "processName": "node",
        "matchedRuleId": "uuid",
        "createdAt": "2025-01-27T14:32:01Z"
      }
    ],
    "total": 1247,
    "hasMore": true
  }
}
```

#### GET /api/scopes/:scopeId/logs/stats
Get access statistics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | hour, day, week, month |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "total": 1247,
    "allowed": 1224,
    "blocked": 23,
    "warnings": 12,
    "operations": {
      "read": 892,
      "write": 342,
      "delete": 13
    },
    "hourly": [
      { "hour": "2025-01-27T00:00:00Z", "allowed": 45, "blocked": 2, "warnings": 1 }
    ]
  }
}
```

#### POST /api/scopes/:scopeId/logs
Create a log entry (from daemon).

**Request:**
```json
{
  "filePath": "src/app.ts",
  "operation": "write",
  "result": "allowed",
  "agentIdentifier": "claude-code",
  "processName": "node",
  "processPid": 12345,
  "matchedRuleId": "uuid"
}
```

#### GET /api/scopes/:scopeId/logs/export
Export logs as CSV.

---

### Violations

#### GET /api/scopes/:scopeId/violations
List violations.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max results |
| severity | string | Filter by severity |
| acknowledged | boolean | Filter by acknowledged status |

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "severity": "high",
        "type": "path_breach",
        "description": "Attempted to access .env.production",
        "affectedPaths": [".env.production"],
        "recommendedAction": "Review agent permissions",
        "acknowledged": false,
        "createdAt": "2025-01-27T14:32:05Z"
      }
    ],
    "total": 23,
    "hasMore": false
  }
}
```

#### GET /api/scopes/:scopeId/violations/summary
Get violation summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 23,
    "unacknowledged": 5,
    "bySeverity": {
      "critical": 1,
      "high": 4,
      "medium": 12,
      "low": 6
    },
    "byType": {
      "path_breach": 10,
      "mass_delete": 2,
      "secret_access": 11
    }
  }
}
```

#### POST /api/scopes/:scopeId/violations/:id/acknowledge
Acknowledge a violation.

**Request:**
```json
{
  "note": "Reviewed and approved by security team"
}
```

---

### Bundles

#### GET /api/bundles
List available bundles (VaultAgent + ScopeAgent).

#### POST /api/bundles/subscribe
Create checkout session for bundle subscription.

**Request:**
```json
{
  "bundleId": "security-stack-pro",
  "interval": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_xxx",
    "url": "https://checkout.stripe.com/..."
  }
}
```

#### GET /api/bundles/status
Get current bundle subscription status.

---

## WebSocket API

Connect to `ws://api.scopeagent.io/ws` for real-time updates.

### Subscribe to Scope

```json
{
  "type": "subscribe",
  "scopeId": "uuid",
  "token": "jwt-token"
}
```

### Events

#### Access Event
```json
{
  "type": "access",
  "data": {
    "id": "uuid",
    "filePath": "/src/app.ts",
    "operation": "write",
    "result": "allowed",
    "timestamp": "2025-01-27T14:32:01Z"
  }
}
```

#### Violation Event
```json
{
  "type": "violation",
  "data": {
    "id": "uuid",
    "severity": "high",
    "type": "secret_access",
    "description": "Attempted to read .env file",
    "timestamp": "2025-01-27T14:32:05Z"
  }
}
```

#### Stats Update
```json
{
  "type": "stats",
  "data": {
    "activeOperations": 5,
    "blockedToday": 23,
    "totalToday": 1247
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Not allowed to access resource |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 10 req/15min |
| API endpoints | 100 req/15min |
| Log ingestion | 1000 req/min |
| WebSocket | 100 msg/min |

---

```
═══════════════════════════════════════════════════════════════════════════════

                           API REFERENCE v1.0

                          (c) 2025 SCOPEAGENT

═══════════════════════════════════════════════════════════════════════════════
```
