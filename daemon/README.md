# @agentleash/daemon

File watcher daemon for AgentLeash. Monitors filesystem operations in real time and enforces access rules for AI coding agents.

```
npm install -g @agentleash/daemon
```

## Usage

```bash
# Initialize config
agentleash-daemon init

# Start watching with passive monitoring
agentleash-daemon start

# Start with active enforcement
agentleash-daemon start --mode active --agent claude-code

# Start with interactive prompting
agentleash-daemon start --mode interactive
```

## What It Does

The daemon watches your project directory using chokidar (for writes/deletes) and atime polling (for reads). It evaluates every file operation against your `.agentleash.yml` rules and reports violations.

## Monitor Modes

| Mode | Behavior |
|------|----------|
| `passive` | Logs all operations, takes no action (default) |
| `active` | Restricts file permissions on deny-rule files |
| `interactive` | Prompts for approval on warn-rule files |

## Configuration

Uses `.agentleash.yml` in your project root. Same format as the `agentleash` CLI package.

## WebSocket Reporting

The daemon exposes a WebSocket server for real-time event streaming. Connect to receive file operation events as they happen.

## Related

- [`agentleash`](https://www.npmjs.com/package/agentleash) - CLI tool
- [agentleash.io](https://agentleash.io) - Web dashboard and docs

## License

MIT - Veridian Tools
