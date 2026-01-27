# Configuration Reference

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  .SCOPEAGENT.YML REFERENCE                                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Complete configuration options for ScopeAgent                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## File Location

ScopeAgent looks for configuration in this order:
1. `--config` flag value
2. `.scopeagent.yml` in current directory
3. `.scopeagent.yaml` in current directory
4. `~/.scopeagent/config.yml` (global config)

## Complete Schema

```yaml
# ═══════════════════════════════════════════════════════════════
# SCOPEAGENT CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Required: Configuration version (currently 1)
version: 1

# Required: Unique name for this scope
name: "my-project-scope"

# Optional: Human-readable description
description: "Monitoring scope for My Project"

# Optional: Base directory (defaults to ".")
base_path: "/Users/dev/projects/myapp"

# Optional: Default policy for unmatched paths
# Values: "allow" | "deny"
# Default: "deny"
default_policy: deny

# ───────────────────────────────────────────────────────────────
# RULES
# Evaluated in order, first match wins
# ───────────────────────────────────────────────────────────────

rules:
  # Basic allow rule
  - path: "src/**"
    allow: [read, write]

  # Basic deny rule
  - path: ".env*"
    deny: [read, write, delete]

  # Mixed permissions
  - path: "node_modules/**"
    allow: [read]
    deny: [write, delete]

  # With reason (shown in logs/alerts)
  - path: "**/*.key"
    deny: [read]
    reason: "Private key files"

  # With exceptions
  - path: ".*"
    deny: [read, write, delete]
    except: [.scopeagent.yml, .gitignore, .eslintrc]

# ───────────────────────────────────────────────────────────────
# AGENT-SPECIFIC RULES
# Override global rules for specific AI agents
# ───────────────────────────────────────────────────────────────

agents:
  # Claude Code specific rules
  claude-code:
    rules:
      - path: "**/*.credential*"
        deny: [read]
      - path: ".claude/**"
        allow: [read, write]

  # Cursor specific rules
  cursor:
    rules:
      - path: ".cursor/**"
        allow: [read, write]
      - path: "tests/**"
        allow: [read, write, delete]

  # Copilot specific rules
  copilot:
    rules:
      - path: ".github/**"
        allow: [read]

# ───────────────────────────────────────────────────────────────
# ALERTS
# Configure violation notifications
# ───────────────────────────────────────────────────────────────

alerts:
  # Violation types to notify on
  notify_on:
    - config_access      # Accessing config files
    - mass_delete        # Deleting many files quickly
    - path_breach        # Accessing outside base_path
    - secret_access      # Accessing .env, credentials
    - critical_path      # Accessing system paths

  # Webhook for notifications (optional)
  webhook_url: "https://hooks.example.com/scopeagent"

  # Email notifications (requires cloud account)
  email: true

  # Slack integration (requires cloud account)
  slack_webhook: "https://hooks.slack.com/services/xxx"

# ───────────────────────────────────────────────────────────────
# ADVANCED
# Additional configuration options
# ───────────────────────────────────────────────────────────────

advanced:
  # Debounce rapid events (milliseconds)
  debounce_ms: 100

  # Maximum events per second before throttling
  rate_limit: 1000

  # Paths to ignore (never logged)
  ignore_paths:
    - "**/.git/objects/**"
    - "**/node_modules/.cache/**"
    - "**/*.swp"
    - "**/*~"

  # Log level: debug | info | warn | error
  log_level: info
```

## Rule Options

### Operations

| Operation | Description |
|-----------|-------------|
| `read` | Reading file contents |
| `write` | Creating or modifying files |
| `delete` | Removing files |
| `execute` | Running executables |
| `list` | Listing directory contents |

### Path Patterns

ScopeAgent uses [minimatch](https://github.com/isaacs/minimatch) for pattern matching:

| Pattern | Matches |
|---------|---------|
| `*` | Anything except path separator |
| `**` | Anything including path separators |
| `?` | Single character |
| `[abc]` | Any character in brackets |
| `[a-z]` | Any character in range |
| `{a,b,c}` | Any of a, b, or c |
| `!(pattern)` | Anything except pattern |

### Examples

```yaml
# All TypeScript and JavaScript files
- path: "**/*.{ts,tsx,js,jsx}"

# Files starting with underscore
- path: "**/_*"

# Specific depth only
- path: "src/*/*.ts"    # Only direct children of src subdirs

# Multiple patterns via multiple rules
- path: "*.config.js"
- path: "*.config.ts"
- path: "*.config.json"

# Negation (must be separate rule)
- path: "src/**"
  allow: [read, write]
- path: "src/**/*.test.ts"
  deny: [write]
```

## Common Configurations

### Node.js Project

```yaml
version: 1
name: "node-project"
default_policy: deny

rules:
  # Source code - full access
  - path: "src/**"
    allow: [read, write, delete]

  # Tests - full access
  - path: "tests/**"
    allow: [read, write, delete]
  - path: "**/*.test.ts"
    allow: [read, write, delete]

  # Config files - read only
  - path: "package.json"
    allow: [read]
  - path: "tsconfig.json"
    allow: [read]
  - path: "*.config.{js,ts,json}"
    allow: [read]

  # Node modules - read only
  - path: "node_modules/**"
    allow: [read]

  # Block secrets
  - path: ".env*"
    deny: [read, write, delete]
  - path: "**/*.key"
    deny: [read]
  - path: "**/secrets/**"
    deny: [read]
```

### Python Project

```yaml
version: 1
name: "python-project"
default_policy: deny

rules:
  # Source code
  - path: "**/*.py"
    allow: [read, write]

  # Virtual environment - read only
  - path: "venv/**"
    allow: [read]
  - path: ".venv/**"
    allow: [read]

  # Requirements
  - path: "requirements*.txt"
    allow: [read]
  - path: "pyproject.toml"
    allow: [read]

  # Block secrets
  - path: ".env*"
    deny: [read]
  - path: "**/credentials*"
    deny: [read]
```

### React/Next.js Project

```yaml
version: 1
name: "react-project"
default_policy: deny

rules:
  # Source code
  - path: "src/**"
    allow: [read, write]
  - path: "app/**"
    allow: [read, write]
  - path: "pages/**"
    allow: [read, write]
  - path: "components/**"
    allow: [read, write]

  # Styles
  - path: "**/*.css"
    allow: [read, write]
  - path: "**/*.scss"
    allow: [read, write]

  # Public assets
  - path: "public/**"
    allow: [read, write]

  # Config - read only
  - path: "next.config.*"
    allow: [read]
  - path: "tailwind.config.*"
    allow: [read]

  # Block secrets
  - path: ".env*"
    deny: [read]
```

### Maximum Security

```yaml
version: 1
name: "high-security"
default_policy: deny

rules:
  # Explicit allowlist only
  - path: "src/components/**/*.tsx"
    allow: [read, write]
  - path: "src/utils/**/*.ts"
    allow: [read, write]

  # Block everything else by default
  # (default_policy: deny handles this)

alerts:
  notify_on:
    - config_access
    - mass_delete
    - path_breach
    - secret_access
    - critical_path
  webhook_url: "https://security.example.com/alerts"
```

## Environment Variables

Configuration can reference environment variables:

```yaml
version: 1
name: "${PROJECT_NAME}-scope"
base_path: "${HOME}/projects/${PROJECT_NAME}"

alerts:
  webhook_url: "${SCOPEAGENT_WEBHOOK_URL}"
```

## Validation

Validate your configuration:

```bash
scopeagent validate

# or with specific file
scopeagent validate -c custom.yml
```

## Debugging

Test rule matching:

```bash
# Test if a path is allowed
scopeagent test src/app.ts
scopeagent test .env --operation read

# Show all rules
scopeagent status

# Verbose watch mode
scopeagent watch --verbose
```

---

```
═══════════════════════════════════════════════════════════════════════════════

                        CONFIGURATION REFERENCE

                          (c) 2025 SCOPEAGENT

═══════════════════════════════════════════════════════════════════════════════
```
