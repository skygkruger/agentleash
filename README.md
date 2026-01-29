# AgentLeash

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ L ├─┤ E ├─┤ A ├─┤ S ├─┤ H │
         └───┘ └───┘ └───┘ └───┘ └───┘
```

**AI agents are powerful. AgentLeash keeps them in line.**

Define path boundaries for AI coding agents. See every file operation in real-time. Get alerts when agents try to access sensitive files.

---

## The Problem

AI coding agents like Claude Code, Cursor, and Copilot are incredibly powerful—but they're also scary. You have zero visibility into what they're actually doing with your file system:

- Did Claude Code just try to read my `.env` file?
- Is Cursor accessing files outside my project?
- What happens if an agent goes rogue and starts deleting files?

## The Solution

AgentLeash gives you complete control and visibility:

1. **Define Boundaries** - Create a `.agentleash.yml` file specifying exactly what paths AI agents can access
2. **Real-time Monitoring** - See every file operation as it happens in your terminal or dashboard
3. **Violation Alerts** - Get notified immediately when agents try to access restricted paths

---

## Quick Start

### Installation

```bash
# Install globally via npm
npm install -g agentleash

# Or use npx
npx agentleash init
```

### Initialize Your Project

```bash
cd your-project
leash init
```

This creates a `.agentleash.yml` file:

```yaml
version: 1
name: "my-project-scope"

default_policy: deny

rules:
  # Allow source code access
  - path: "src/**"
    allow: [read, write]

  # Block environment files
  - path: ".env*"
    deny: [read, write, delete]
    reason: "Environment files contain secrets"

  # Read-only for configs
  - path: "*.config.js"
    allow: [read]
    deny: [write, delete]
```

### Start Monitoring

```bash
leash watch
```

```
╔══════════════════════════════════════════════════════════════════════╗
║  AGENTLEASH                                          [WATCHING...]   ║
╠══════════════════════════════════════════════════════════════════════╣
║  Scope: my-project-scope                                             ║
║  Path:  /Users/dev/projects/myapp                                    ║
║  Rules: 15 active                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  RECENT ACTIVITY                                                     ║
║  ───────────────────────────────────────────────────────────────     ║
║  14:32:01  [/]  READ   src/components/Button.tsx                     ║
║  14:32:02  [/]  WRITE  src/components/Button.tsx                     ║
║  14:32:05  [X]  READ   .env.local                    [BLOCKED]       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `leash init` | Create `.agentleash.yml` in current directory |
| `leash watch` | Start monitoring file operations |
| `leash status` | Show current scope info and stats |
| `leash logs` | View recent access logs |
| `leash allow <pattern>` | Quick add an allow rule |
| `leash deny <pattern>` | Quick add a deny rule |
| `leash test <path>` | Test if a path would be allowed |
| `leash sync` | Sync config to/from cloud |

---

## Configuration Reference

### Basic Structure

```yaml
version: 1
name: "my-scope"
base_path: .  # defaults to current directory
default_policy: deny  # 'allow' or 'deny'

rules:
  - path: "pattern"
    allow: [read, write, delete, execute]
    deny: [read, write, delete, execute]
    reason: "Why this rule exists"
```

### Path Patterns

AgentLeash supports glob patterns:

| Pattern | Matches |
|---------|---------|
| `*` | Any single directory level |
| `**` | Any number of directory levels |
| `?` | Any single character |
| `[abc]` | Any character in brackets |
| `{a,b}` | Either a or b |
| `!pattern` | Negation (exclude) |

### Examples

```yaml
rules:
  # All TypeScript files
  - path: "**/*.ts"
    allow: [read, write]

  # Specific file
  - path: "package.json"
    allow: [read]
    deny: [write, delete]

  # Directory and all contents
  - path: "node_modules/**"
    allow: [read]
    deny: [write, delete]

  # Multiple extensions
  - path: "**/*.{key,pem,crt}"
    deny: [read]
    reason: "Private keys and certificates"
```

### Agent-Specific Rules

```yaml
agents:
  claude-code:
    rules:
      - path: "**/*.key"
        deny: [read]

  cursor:
    rules:
      - path: "tests/**"
        allow: [read, write, delete]
```

---

## Complete AI Security Stack

AgentLeash pairs perfectly with **VaultAgent** for complete AI agent security:

| | VaultAgent | AgentLeash |
|---|---|---|
| **Protects** | Secrets FROM agents | Systems FROM agents |
| **Controls** | API keys, passwords, credentials | File access, paths, operations |
| **Use case** | Prevent secret leakage | Prevent unauthorized access |

**Bundle both and save 15%** → [veridiantools.dev](https://veridiantools.dev)

---

## Pricing

| Plan | Scopes | Logs/day | Features | Price |
|------|--------|----------|----------|-------|
| Free | 1 | 1,000 | Basic monitoring | $0 |
| Pro | 5 | 10,000 | Custom rules, Export | $19/mo |
| Team | 20 | 100,000 | Team sharing, Webhooks | $49/mo |
| Enterprise | ∞ | ∞ | SSO, Compliance | $149/mo |

---

## Support

- Documentation: [agentleash.io/docs](https://agentleash.io/docs)
- GitHub Issues: [github.com/skygkruger/agentleash](https://github.com/skygkruger/agentleash)
- Email: sky@veridian.run
- Twitter: [@agentleash](https://twitter.com/agentleash)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

```
═══════════════════════════════════════════════════════════════════════════════

                        KEEPING AI AGENTS IN CHECK

                             (c) 2025 AGENTLEASH
                        Part of the Veridian family

═══════════════════════════════════════════════════════════════════════════════
```
