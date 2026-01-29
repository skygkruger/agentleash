# Security Model

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT SECURITY                                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Understanding what ScopeAgent can and cannot do                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Overview

ScopeAgent is a **monitoring and alerting** tool for AI agent file system activity. It provides visibility and notifications but operates within the constraints of the operating system's security model.

## What ScopeAgent CAN Do

### 1. Monitor File Operations
- Watch for file system events (create, modify, delete, read)
- Log all operations to a central database
- Provide real-time visibility via CLI and dashboard

### 2. Alert on Violations
- Detect when AI agents attempt to access restricted paths
- Send real-time alerts via WebSocket, webhooks, or email
- Create violation reports for audit purposes

### 3. Track Patterns
- Identify suspicious activity patterns (mass deletion, credential access)
- Correlate operations with specific AI agents
- Generate reports and statistics

### 4. Provide Visibility
- Real-time terminal UI showing all file operations
- Web dashboard with historical data
- Export capabilities for compliance

## What ScopeAgent CANNOT Do

### 1. Prevent File Operations in Real-time
ScopeAgent **monitors** file operations but cannot truly **block** them at the kernel level. The operating system allows the AI agent process to access files; ScopeAgent observes these operations.

**Why?** ScopeAgent runs as a user-space daemon, not a kernel module. True file system blocking would require:
- Kernel-level interception (FUSE, kernel modules)
- Root/admin privileges
- Platform-specific implementations

### 2. Intercept Network Requests
ScopeAgent monitors file system activity, not network traffic. It cannot see or block:
- API calls made by AI agents
- Data exfiltration over the network
- Remote code execution

### 3. Guarantee Perfect Detection
File operations can occur between daemon restarts or during high system load. ScopeAgent provides **best-effort** monitoring, not guaranteed interception.

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            SECURITY LAYERS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: OPERATING SYSTEM                                                   │
│  ─────────────────────────                                                   │
│  - File permissions (chmod, ACLs)                                            │
│  - User isolation                                                            │
│  - Process sandboxing                                                        │
│  [This is the true security boundary]                                        │
│                                                                              │
│  LAYER 2: SCOPEAGENT                                                         │
│  ─────────────────────                                                       │
│  - Path-based rules                                                          │
│  - Operation monitoring                                                      │
│  - Violation alerting                                                        │
│  [This provides visibility and alerting]                                     │
│                                                                              │
│  LAYER 3: AI AGENT SANDBOX (if available)                                    │
│  ────────────────────────                                                    │
│  - Agent-specific restrictions                                               │
│  - Configuration limits                                                      │
│  [Varies by AI tool]                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Threat Model

### Threats ScopeAgent Helps With

| Threat | Mitigation |
|--------|------------|
| Accidental secret access | Alert when .env files are accessed |
| Unintended file deletion | Log and alert on delete operations |
| Scope creep | Detect access outside expected paths |
| Audit requirements | Provide complete access logs |
| Suspicious patterns | Detect mass operations or unusual activity |

### Threats ScopeAgent Does NOT Address

| Threat | Why Not |
|--------|---------|
| Malicious AI agent | Cannot block at kernel level |
| Root-level compromise | ScopeAgent runs as user |
| Memory-based attacks | Only monitors file system |
| Network exfiltration | Not a network monitor |
| Insider threats | Still provides useful audit trail |

## Best Practices

### 1. Layer Your Security
Don't rely on ScopeAgent alone. Use it alongside:
- Operating system permissions
- AI agent sandboxing features
- VaultAgent for secret management
- Network monitoring tools

### 2. Configure Strict Rules
```yaml
# Start with deny-all policy
default_policy: deny

# Explicitly allow only necessary paths
rules:
  - path: "src/**"
    allow: [read, write]
  - path: "tests/**"
    allow: [read, write, delete]
```

### 3. Monitor Alerts
Set up notifications for violations:
```yaml
alerts:
  notify_on:
    - config_access
    - mass_delete
    - path_breach
  webhook_url: "https://your-webhook.example.com"
```

### 4. Review Logs Regularly
- Check the dashboard for unusual patterns
- Export logs for compliance audits
- Investigate all violation alerts

### 5. Keep ScopeAgent Updated
Security issues may be discovered and patched. Always run the latest version:
```bash
npm update -g @veridian/scopeagent
```

## Data Security

### What ScopeAgent Collects
- File paths accessed
- Operation types (read, write, delete, etc.)
- Timestamps
- Agent identifiers (when available)
- Process information

### What ScopeAgent Does NOT Collect
- File contents
- Credentials or secrets
- Personal data (unless in file paths)
- Network traffic

### Data Storage
- Local: Logs stored in daemon memory (not persisted locally by default)
- Cloud: Logs sent to ScopeAgent API (if authenticated)
- You control: Export and delete your data anytime

## Reporting Security Issues

If you discover a security vulnerability in ScopeAgent:

1. **Do NOT** create a public GitHub issue
2. Email: sky@veridian.run
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you on a fix before public disclosure.

## Compliance

ScopeAgent can help with compliance requirements by providing:
- Audit trails of file access
- Exportable logs (CSV, JSON)
- Violation reports
- Access statistics

However, ScopeAgent alone does not make your system compliant. Consult with your compliance team about specific requirements.

---

```
═══════════════════════════════════════════════════════════════════════════════

                     SECURITY THROUGH VISIBILITY

                          (c) 2025 SCOPEAGENT

═══════════════════════════════════════════════════════════════════════════════
```
