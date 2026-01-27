# SCOPEAGENT LOGO COLLECTION
## Pastel Retro Terminal Design System
## Primary Color: Amber #d4a76a

---

## MAIN LOGO (60-char width)

```javascript
const SCOPEAGENT_LOGO = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ███████╗ ██████╗ ██████╗ ██████╗ ███████╗              ║
║   ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝              ║
║   ███████╗██║     ██║   ██║██████╔╝█████╗                ║
║   ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝                ║
║   ███████║╚██████╗╚██████╔╝██║     ███████╗              ║
║   ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝              ║
║                                                          ║
║         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                   ║
║         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │                   ║
║         └───┘ └───┘ └───┘ └───┘ └───┘                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝`;

<pre className="text-xs leading-tight" style={{ color: '#d4a76a' }}>
  {SCOPEAGENT_LOGO}
</pre>
```

---

## COMPACT LOGO (For Headers)

```javascript
const SCOPEAGENT_COMPACT = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                                  [DOCS]  [PRICING]  [GITHUB]  [@]  ║
╚══════════════════════════════════════════════════════════════════════════════╝`;
```

---

## ICON VARIATIONS

### Shield Icon (Primary Symbol)
```javascript
const SHIELD_ICON = `
    ┌─────┐
    │ ▓▓▓ │
    │ ▓▓▓ │
    │ ▓▓▓ │
    │  ▓  │
    └──▓──┘
`;
```

### Scope/Crosshair Icon
```javascript
const SCOPE_ICON = `
      │
   ─┬─┼─┬─
    │ │ │
   ─┴─┼─┴─
      │
`;
```

### Boundary Icon
```javascript
const BOUNDARY_ICON = `
  ╔═══╗
  ║ # ║
  ╚═══╝
`;
```

### Agent Control Icon
```javascript
const AGENT_ICON = `
  [#]─┬─[X]
      │
    [>]
`;
```

---

## FEATURE BOXES

### Path Boundaries
```javascript
const FEATURE_PATHS = `
┌───────────────────────────┐
│                           │
│    [#] PATH BOUNDARIES    │
│                           │
│  Define exactly what      │
│  AI agents can access.    │
│  Glob patterns, deny      │
│  lists, fine control.     │
│                           │
└───────────────────────────┘`;
```

### Real-Time Monitoring
```javascript
const FEATURE_MONITOR = `
┌───────────────────────────┐
│                           │
│    [>] REAL-TIME VIEW     │
│                           │
│  See every file           │
│  operation as it          │
│  happens. Full            │
│  visibility.              │
│                           │
└───────────────────────────┘`;
```

### Violation Alerts
```javascript
const FEATURE_ALERTS = `
┌───────────────────────────┐
│                           │
│    [!] ALERTS             │
│                           │
│  Get notified when        │
│  agents try to            │
│  access sensitive         │
│  files or paths.          │
│                           │
└───────────────────────────┘`;
```

---

## STATUS INDICATORS

```javascript
// Allowed operation
const STATUS_ALLOWED = '[/]';  // Mint color #a8d8b9

// Blocked operation  
const STATUS_BLOCKED = '[X]';  // Coral color #eb6f92

// Warning
const STATUS_WARNING = '[!]';  // Cream/Yellow #ffe9b0

// Watching/Active
const STATUS_WATCHING = '[*]'; // Amber color #d4a76a

// Pending/Coming soon
const STATUS_PENDING = '[~]';  // Muted color #6e6a86

// Question/Help
const STATUS_HELP = '[?]';     // Cyan color #7eb8da

// Add/New
const STATUS_ADD = '[+]';      // Amber color #d4a76a

// Config/Settings
const STATUS_CONFIG = '[#]';   // Lavender #c4a7e7
```

---

## FLOW DIAGRAMS

### How It Works
```javascript
const HOW_IT_WORKS = `
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
└─────────────────────────────────────────────────────────────────────┘`;
```

### Security Stack
```javascript
const SECURITY_STACK = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ┌────────────────────────────┐    ┌────────────────────────────┐          ║
║   │                            │    │                            │          ║
║   │       VAULTAGENT           │    │       SCOPEAGENT           │          ║
║   │                            │    │                            │          ║
║   │  Protects SECRETS          │    │  Protects SYSTEMS          │          ║
║   │  from AI agents            │    │  from AI agents            │          ║
║   │                            │    │                            │          ║
║   │  [/] Zero-knowledge        │    │  [/] Path boundaries       │          ║
║   │  [/] Scoped sessions       │    │  [/] Real-time monitor     │          ║
║   │  [/] Full audit            │    │  [/] Violation alerts      │          ║
║   │                            │    │                            │          ║
║   └────────────────────────────┘    └────────────────────────────┘          ║
║                                                                              ║
║                    BUNDLE & SAVE 15%  [$20/mo instead of $24]                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝`;
```

---

## COLOR REFERENCE

```javascript
const colors = {
  // Base
  bg: '#1a1a2e',
  bgLight: '#252542',
  text: '#e8e3e3',
  muted: '#6e6a86',
  
  // ScopeAgent Primary
  amber: '#d4a76a',
  
  // Semantic
  mint: '#a8d8b9',      // Success/Allowed
  coral: '#eb6f92',     // Error/Blocked
  cream: '#ffe9b0',     // Warning
  lavender: '#c4a7e7',  // Info/Highlight
  cyan: '#7eb8da',      // Links/Interactive
};
```

---

## USAGE NOTES

1. **Font**: JetBrains Mono or Fira Code (monospace with box-drawing support)
2. **Background**: Always use dark background #1a1a2e
3. **Line height**: Use `leading-tight` or `line-height: 1.2`
4. **Encoding**: Must be UTF-8
5. **Escape backslashes**: In JavaScript, use `\\` for `\`

---

*ScopeAgent Logo Collection*
*Pastel Retro Terminal Design System*
*Primary Color: Amber #d4a76a*
