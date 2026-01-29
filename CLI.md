# CLI Reference

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  AGENTLEASH CLI REFERENCE                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Command-line interface documentation                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Installation

```bash
# Install globally
npm install -g agentleash

# Or use npx
npx agentleash <command>

# Verify installation
leash --version
```

---

## Commands

### leash init

Initialize a new `.agentleash.yml` configuration file.

```bash
leash init [path]
```

**Options:**
| Flag | Description |
|------|-------------|
| `--force, -f` | Overwrite existing config |
| `--preset <name>` | Use a preset (node, python, react) |

**Examples:**
```bash
# Initialize in current directory
leash init

# Initialize in specific directory
leash init /path/to/project

# Force overwrite existing config
leash init --force

# Use Node.js preset
leash init --preset node
```

---

### leash login

Authenticate with AgentLeash cloud.

```bash
leash login
```

**Options:**
| Flag | Description |
|------|-------------|
| `--api-key <key>` | Login with API key (non-interactive) |
| `--browser` | Open browser for OAuth login |

**Examples:**
```bash
# Interactive login
leash login

# Login with API key (for CI/CD)
leash login --api-key al_abc123...

# Browser-based OAuth
leash login --browser
```

Credentials are stored in `~/.agentleash/credentials`.

---

### leash logout

Log out and clear credentials.

```bash
leash logout
```

---

### leash watch

Start the file watcher daemon.

```bash
leash watch [path]
```

**Options:**
| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to config file |
| `-v, --verbose` | Enable verbose logging |
| `--no-colors` | Disable colored output |
| `--daemon` | Run in background |
| `-m, --mode <mode>` | Monitor mode: passive, active, interactive |
| `-a, --agent <name>` | Agent name: claude-code, cursor, windsurf, etc. |

**Examples:**
```bash
# Watch current directory
leash watch

# Watch specific directory
leash watch /path/to/project

# Use custom config
leash watch -c custom.yml

# Verbose mode
leash watch --verbose

# Run as background daemon
leash watch --daemon

# Active mode (enforces deny rules)
leash watch --mode active

# Track specific agent
leash watch --agent claude-code
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

### leash status

Show current scope status and configuration.

```bash
leash status
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
leash status

# Show combined status with VaultAgent
leash status --vault

# JSON output for scripting
leash status --json
```

---

### leash logs

View access logs.

```bash
leash logs
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
leash logs

# Show last 100 logs
leash logs -n 100

# Filter by operation
leash logs --operation write

# Filter blocked operations
leash logs --result blocked

# Follow mode (like tail -f)
leash logs --follow
```

---

### leash allow

Quick add an allow rule.

```bash
leash allow <pattern>
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
leash allow "src/**/*.ts"

# Allow specific operations
leash allow "tests/**" --operation read,write

# With reason
leash allow "docs/**" --reason "Documentation files"
```

---

### leash deny

Quick add a deny rule.

```bash
leash deny <pattern>
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
leash deny ".env*"

# Deny specific operations
leash deny "node_modules/**" --operation write,delete

# With reason
leash deny "**/*.key" --reason "Private key files"
```

---

### leash test

Test if a path would be allowed or blocked.

```bash
leash test <path>
```

**Options:**
| Flag | Description |
|------|-------------|
| `-o, --operation <type>` | Operation to test (default: read) |
| `-c, --config <path>` | Path to config file |

**Examples:**
```bash
# Test read access
leash test src/app.ts

# Test write access
leash test package.json --operation write

# Test against .env
leash test .env.local --operation read
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

### leash sync

Sync configuration with cloud.

```bash
leash sync
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
leash sync

# Pull cloud config (overwrites local)
leash sync --pull

# Push local config to cloud
leash sync --push

# Force push without confirmation
leash sync --push --force
```

---

### leash validate

Validate configuration file.

```bash
leash validate
```

**Options:**
| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to config file |

**Examples:**
```bash
# Validate default config
leash validate

# Validate specific file
leash validate -c custom.yml
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

### leash link-vault

Link VaultAgent account for combined security.

```bash
leash link-vault
```

**Options:**
| Flag | Description |
|------|-------------|
| `--api-key <key>` | VaultAgent API key |
| `--unlink` | Unlink VaultAgent account |

**Examples:**
```bash
# Check link status
leash link-vault

# Link with API key
leash link-vault --api-key va_abc123...

# Unlink
leash link-vault --unlink
```

---

### leash vault-rules

Generate deny rules for VaultAgent protected paths.

```bash
leash vault-rules
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
| `AGENTLEASH_API_URL` | API server URL |
| `AGENTLEASH_CONFIG` | Default config file path |
| `AGENTLEASH_TOKEN` | Authentication token |
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
2. `.agentleash.yml` in current directory
3. `~/.agentleash/config.yml` (global)

See [CONFIG.md](CONFIG.md) for full configuration reference.

---

## Credentials

Credentials are stored in `~/.agentleash/credentials`:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "apiKey": "al_..."
}
```

To clear credentials:
```bash
leash logout

# Or manually
rm ~/.agentleash/credentials
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Setup AgentLeash
  run: npm install -g agentleash

- name: Login
  run: leash login --api-key ${{ secrets.AGENTLEASH_API_KEY }}

- name: Validate Config
  run: leash validate

- name: Sync Rules
  run: leash sync --push
```

### GitLab CI

```yaml
agentleash:
  script:
    - npm install -g agentleash
    - leash login --api-key $AGENTLEASH_API_KEY
    - leash validate
    - leash sync --push
```

---

## Troubleshooting

### "Configuration file not found"

```bash
# Create new config
leash init

# Or specify path
leash watch -c /path/to/.agentleash.yml
```

### "Not authenticated"

```bash
# Login again
leash login

# Or use API key
leash login --api-key al_...
```

### "Permission denied"

Ensure you have read access to the directory:
```bash
ls -la .agentleash.yml
```

### "WebSocket connection failed"

Check network connectivity:
```bash
curl https://api.agentleash.io/health
```

---

```
═══════════════════════════════════════════════════════════════════════════════

                           CLI REFERENCE v1.0

                          (c) 2025 AGENTLEASH

═══════════════════════════════════════════════════════════════════════════════
```
