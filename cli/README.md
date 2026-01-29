# agentleash

AI Agent Access Control CLI. Define path boundaries, monitor file operations, get alerts when AI coding agents go out of scope.

```
npm install -g agentleash
```

## What It Does

AgentLeash monitors what AI coding agents (Claude Code, Cursor, Windsurf, Aider, GitHub Copilot, Continue) do to your filesystem. Define which paths are allowed, denied, or warned, then watch in real time.

## Quick Start

```bash
# Create a config file
leash init

# Start monitoring
leash watch

# Start monitoring with active enforcement
leash watch --mode active --agent claude-code

# Test if a path is allowed
leash test src/app.ts

# Add rules
leash allow "src/**"
leash deny ".env"
```

## Monitor Modes

| Mode | Behavior |
|------|----------|
| `passive` | Logs all file operations (default) |
| `active` | Enforces deny rules by restricting file permissions |
| `interactive` | Prompts for approval on warn-rule files |

```bash
leash watch --mode passive      # Log only
leash watch --mode active       # Enforce deny rules
leash watch --mode interactive  # Prompt for approval
```

## Configuration

AgentLeash uses `.agentleash.yml` in your project root:

```yaml
version: 1
name: my-project
defaultPolicy: deny

rules:
  - path: "src/**"
    allow: [read, write]
    reason: Source code

  - path: ".env"
    deny: [read, write, delete]
    reason: Environment secrets

  - path: "node_modules/**"
    deny: [write, delete]
    reason: Dependencies are managed by package manager
```

## Commands

| Command | Description |
|---------|-------------|
| `leash init` | Create `.agentleash.yml` config |
| `leash watch` | Start monitoring file operations |
| `leash test <path>` | Test if a path would be allowed/denied |
| `leash rules` | List configured rules |
| `leash allow <pattern>` | Add an allow rule |
| `leash deny <pattern>` | Add a deny rule |
| `leash rule-remove <pattern>` | Remove a rule |
| `leash validate` | Validate config file |
| `leash doctor` | Check AgentLeash setup |
| `leash status` | Show current scope info |
| `leash login` | Authenticate with AgentLeash cloud |
| `leash sync` | Sync config with cloud |
| `leash logs` | View access logs from cloud |
| `leash stats` | View access statistics |

## Agent Verification

When you specify `--agent`, AgentLeash verifies the agent process is actually running:

```bash
leash watch --agent claude-code
# [>] Agent verified: claude-code (PID: 12345)
```

Supported agents: `claude-code`, `cursor`, `windsurf`, `aider`, `github-copilot`, `continue`

## Read Detection

AgentLeash detects file reads via filesystem atime polling in addition to write/delete detection via chokidar. Read detection requires atime to be enabled on your filesystem.

**Windows**: You may need to run `fsutil behavior set disablelastaccess 0` as Administrator.

## Known Limitations

- Read detection uses atime polling (2s latency, requires atime enabled on filesystem)
- Active mode restricts file permissions for ALL processes, not just the monitored agent
- File renames appear as a delete + create pair
- Agent verification matches process names, not specific process instances

## Links

- Website: https://agentleash.io
- Documentation: https://agentleash.io/docs
- Issues: https://github.com/skygkruger/scopeagent/issues

## License

MIT - Veridian Tools
