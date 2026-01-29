# Changelog

All notable changes to AgentLeash will be documented in this file.

## [1.0.1] - 2026-01-28

### Fixed
- Fixed npm package repository URLs pointing to correct GitHub repo
- Fixed bin entry path format for npm compatibility

## [1.0.0] - 2026-01-28

### Added
- CLI published to npm as `agentleash` (command: `leash`)
- `leash init` - Create `.agentleash.yml` configuration with presets (minimal, strict, nodejs, python)
- `leash watch` - Real-time file operation monitoring with three modes:
  - **Passive** - Log all file operations (default)
  - **Active** - Enforce deny rules via file permission restriction
  - **Interactive** - Prompt for approval on warn-rule files
- `leash test` - Test if a path would be allowed/denied by current rules
- `leash rules` / `leash allow` / `leash deny` - Manage access rules
- `leash validate` / `leash doctor` - Config validation and setup diagnostics
- `leash login` / `leash logout` / `leash whoami` - Authentication
- `leash sync` / `leash link` / `leash unlink` - Cloud configuration sync
- `leash logs` / `leash stats` - Cloud access logs and statistics
- Read detection via filesystem atime polling
- Agent process verification for 6 AI coding agents (Claude Code, Cursor, Windsurf, Aider, GitHub Copilot, Continue)
- File watcher daemon (`@agentleash/daemon`) with WebSocket reporting
- VaultAgent cross-product integration
- Web dashboard with docs, pricing, and agent setup guides
- REST API with JWT auth, API key auth, rate limiting
