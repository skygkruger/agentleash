# CLI Reference

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT CLI REFERENCE                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Command-line interface documentation                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Installation

```bash
# Install globally
npm install -g @veridian/scopeagent

# Or use npx
npx @veridian/scopeagent <command>

# Verify installation
scopeagent --version
```

---

## Commands

### scopeagent init

Initialize a new `.scopeagent.yml` configuration file.

```bash
scopeagent init [path]
```

**Options:**
| Flag | Description |
|------|-------------|
| `--force, -f` | Overwrite existing config |
| `--template <name>` | Use a template (node, python, react) |

**Examples:**
```bash
# Initialize in current directory
scopeagent init

# Initialize in specific directory
scopeagent init /path/to/project

# Force overwrite existing config
scopeagent init --force

# Use Node.js template
scopeagent init --template node
```

---

### scopeagent login

Authenticate with ScopeAgent cloud.

```bash
scopeagent login
```

**Options:**
| Flag | Description |
|------|-------------|
| `--api-key <key>` | Login with API key (non-interactive) |
| `--browser` | Open browser for OAuth login |

**Examples:**
```bash
# Interactive login
scopeagent login

# Login with API key (for CI/CD)
scopeagent login --api-key sa_abc123...

# Browser-based OAuth
scopeagent login --browser
```

Credentials are stored in `~/.scopeagent/credentials`.

---

### scopeagent logout

Log out and clear credentials.

```bash
scopeagent logout
```

---

### scopeagent watch

Start the file watcher daemon.

```bash
scopeagent watch [path]
```

**Options:**
| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to config file |
| `-v, --verbose` | Enable verbose logging |
| `--no-colors` | Disable colored output |
| `--daemon` | Run in background |

**Examples:**
```bash
# Watch current directory
scopeagent watch

# Watch specific directory
scopeagent watch /path/to/project

# Use custom config
scopeagent watch -c custom.yml

# Verbose mode
scopeagent watch --verbose

# Run as background daemon
scopeagent watch --daemon
```

**Interactive Keys (while watching):**
| Key | Action |
|-----|--------|
| `q` | Quit |
| `p` | Pause/Resume |
| `c` | Clear screen |
| `s` | Show statistics |
| `r` | Show active rules |
| `h` | Show help |

---

### scopeagent status

Show current scope status and configuration.

```bash
scopeagent status
```

**Options:**
| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to config file |
| `--vault` | Show combined status with VaultAgent |
| `--json` | Output as JSON |

**Examples:**
```bash
# Show status
scopeagent status

# Show combined status with VaultAgent
scopeagent status --vault

# JSON output for scripting
scopeagent status --json
```

---

### scopeagent logs

View access logs.

```bash
scopeagent logs
```

**Options:**
| Flag | Description |
|------|-------------|
| `-n, --limit <num>` | Number of entries (default: 50) |
| `--operation <type>` | Filter by operation |
| `--result <type>` | Filter by result |
| `--follow, -f` | Follow new entries |
| `--json` | Output as JSON |

**Examples:**
```bash
# Show last 50 logs
scopeagent logs

# Show last 100 logs
scopeagent logs -n 100

# Filter by operation
scopeagent logs --operation write

# Filter blocked operations
scopeagent logs --result blocked

# Follow mode (like tail -f)
scopeagent logs --follow
```

---

### scopeagent allow

Quick add an allow rule.

```bash
scopeagent allow <pattern>
```

**Options:**
| Flag | Description |
|------|-------------|
| `-o, --operation <type>` | Operations to allow (comma-separated) |
| `--reason <text>` | Reason for the rule |
| `-c, --config <path>` | Path to config file |

**Examples:**
```bash
# Allow all access to pattern
scopeagent allow "src/**/*.ts"

# Allow specific operations
scopeagent allow "tests/**" --operation read,write

# With reason
scopeagent allow "docs/**" --reason "Documentation files"
```

---

### scopeagent deny

Quick add a deny rule.

```bash
scopeagent deny <pattern>
```

**Options:**
| Flag | Description |
|------|-------------|
| `-o, --operation <type>` | Operations to deny |
| `--reason <text>` | Reason for the rule |
| `-c, --config <path>` | Path to config file |

**Examples:**
```bash
# Deny all access to pattern
scopeagent deny ".env*"

# Deny specific operations
scopeagent deny "node_modules/**" --operation write,delete

# With reason
scopeagent deny "**/*.key" --reason "Private key files"
```

---

### scopeagent test

Test if a path would be allowed or blocked.

```bash
scopeagent test <path>
```

**Options:**
| Flag | Description |
|------|-------------|
| `-o, --operation <type>` | Operation to test (default: read) |
| `-c, --config <path>` | Path to config file |

**Examples:**
```bash
# Test read access
scopeagent test src/app.ts

# Test write access
scopeagent test package.json --operation write

# Test against .env
scopeagent test .env.local --operation read
```

**Output:**
```
[?] Testing path: .env.local
    Operation: read

[X] BLOCKED
    Reason: Matched rule: .env*
    Rule: deny [read, write, delete]
```

---

### scopeagent sync

Sync configuration with cloud.

```bash
scopeagent sync
```

**Options:**
| Flag | Description |
|------|-------------|
| `--pull` | Pull config from cloud |
| `--push` | Push local config to cloud |
| `--force` | Overwrite without confirmation |

**Examples:**
```bash
# Two-way sync (merge)
scopeagent sync

# Pull cloud config (overwrites local)
scopeagent sync --pull

# Push local config to cloud
scopeagent sync --push

# Force push without confirmation
scopeagent sync --push --force
```

---

### scopeagent validate

Validate configuration file.

```bash
scopeagent validate
```

**Options:**
| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to config file |

**Examples:**
```bash
# Validate default config
scopeagent validate

# Validate specific file
scopeagent validate -c custom.yml
```

**Output:**
```
[/] Configuration is valid
    Scope: my-project-scope
    Rules: 15
```

Or with errors:
```
[X] Validation failed:
    - Invalid operation 'create' at rules[2].allow
    - Missing required field 'version'
```

---

### scopeagent link-vault

Link VaultAgent account for combined security.

```bash
scopeagent link-vault
```

**Options:**
| Flag | Description |
|------|-------------|
| `--api-key <key>` | VaultAgent API key |
| `--unlink` | Unlink VaultAgent account |

**Examples:**
```bash
# Check link status
scopeagent link-vault

# Link with API key
scopeagent link-vault --api-key va_abc123...

# Unlink
scopeagent link-vault --unlink
```

---

### scopeagent vault-rules

Generate deny rules for VaultAgent protected paths.

```bash
scopeagent vault-rules
```

**Options:**
| Flag | Description |
|------|-------------|
| `--apply` | Apply rules to config (not implemented) |

Shows paths that VaultAgent protects and suggests deny rules.

---

## Global Options

These options work with all commands:

| Flag | Description |
|------|-------------|
| `--version, -V` | Show version number |
| `--help, -h` | Show help |
| `--no-colors` | Disable colored output |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SCOPEAGENT_API_URL` | API server URL |
| `SCOPEAGENT_CONFIG` | Default config file path |
| `SCOPEAGENT_TOKEN` | Authentication token |
| `NO_COLOR` | Disable colors |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Authentication error |
| 4 | Network error |

---

## Configuration File

The CLI reads configuration from:

1. `--config` flag value
2. `.scopeagent.yml` in current directory
3. `~/.scopeagent/config.yml` (global)

See [CONFIG.md](CONFIG.md) for full configuration reference.

---

## Credentials

Credentials are stored in `~/.scopeagent/credentials`:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "apiKey": "sa_..."
}
```

To clear credentials:
```bash
scopeagent logout

# Or manually
rm ~/.scopeagent/credentials
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Setup ScopeAgent
  run: npm install -g @veridian/scopeagent

- name: Login
  run: scopeagent login --api-key ${{ secrets.SCOPEAGENT_API_KEY }}

- name: Validate Config
  run: scopeagent validate

- name: Sync Rules
  run: scopeagent sync --push
```

### GitLab CI

```yaml
scopeagent:
  script:
    - npm install -g @veridian/scopeagent
    - scopeagent login --api-key $SCOPEAGENT_API_KEY
    - scopeagent validate
    - scopeagent sync --push
```

---

## Troubleshooting

### "Configuration file not found"

```bash
# Create new config
scopeagent init

# Or specify path
scopeagent watch -c /path/to/.scopeagent.yml
```

### "Not authenticated"

```bash
# Login again
scopeagent login

# Or use API key
scopeagent login --api-key sa_...
```

### "Permission denied"

Ensure you have read access to the directory:
```bash
ls -la .scopeagent.yml
```

### "WebSocket connection failed"

Check network connectivity:
```bash
curl https://api.scopeagent.io/health
```

---

```
═══════════════════════════════════════════════════════════════════════════════

                           CLI REFERENCE v1.0

                          (c) 2025 SCOPEAGENT

═══════════════════════════════════════════════════════════════════════════════
```
