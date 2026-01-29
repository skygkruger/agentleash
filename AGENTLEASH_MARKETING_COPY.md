# AGENTLEASH - MARKETING & LAUNCH COPY
## Veridian Manifesto Style

---

## PRODUCT HUNT LAUNCH

### Tagline (60 chars max)
```
AI agents are powerful. AgentLeash keeps them in line.
```

### Description (260 chars max)
```
Define path boundaries for AI coding agents. See every file operation in real-time. Get alerts when agents try to access sensitive files. Works with Claude Code, Cursor, and any AI tool. The missing security layer for AI-assisted development.
```

### First Comment (Maker's Comment)
```
Hey Product Hunt!

I built AgentLeash because I kept having this paranoid feeling while using AI coding agents: "Wait, can Claude Code read my .env file right now? Did Cursor just try to delete my node_modules?"

The problem: AI agents are incredibly powerful, but you have zero visibility into what they're actually doing with your file system.

The solution: AgentLeash lets you define exactly what paths agents can access, monitors every file operation in real-time, and alerts you when something looks suspicious.

How it works:
1. Drop a .agentleash.yml in your project
2. Run `leash watch`
3. See everything. Block what you don't want.

It pairs perfectly with VaultAgent (which protects secrets FROM agents) - together they form a complete AI Agent Security Stack.

Free tier available. Open to all feedback!
```

---

## LANDING PAGE COPY

### Hero Section
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  AI AGENTS ARE POWERFUL                                          │
│  AGENTLEASH KEEPS THEM IN LINE                                   │
│                                                                  │
│  Define path boundaries. Monitor operations. Get alerts.         │
│  The missing security layer for AI-assisted development.         │
│                                                                  │
│  [GET STARTED FREE]        [VIEW DEMO]                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Problem Statement
```
// THE REALITY OF AI CODING AGENTS

You use Claude Code, Cursor, or Copilot to write code faster.
But have you ever wondered:

[?] What files is the agent actually reading?
[?] Did it just try to access my .env?
[?] Can it see my SSH keys?
[?] What if it goes rogue and deletes things?

You don't know. You can't see. That's terrifying.
```

### Solution
```
// AGENTLEASH GIVES YOU CONTROL

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. DEFINE         2. WATCH           3. PROTECT               │
│   ───────────       ───────────        ───────────              │
│                                                                 │
│   Create your       Start the          Get alerts               │
│   .agentleash.yml   daemon with        when agents              │
│   with path rules   one command        cross the line           │
│                                                                 │
│   $ leash           $ leash            [!] VIOLATION            │
│     init              watch            .env access blocked      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Features
```
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│                           │ │                           │ │                           │
│  [#] PATH BOUNDARIES      │ │  [>] REAL-TIME VIEW       │ │  [!] VIOLATION ALERTS     │
│                           │ │                           │ │                           │
│  Define exactly what      │ │  See every single file    │ │  Get notified instantly   │
│  AI agents can access.    │ │  operation as it          │ │  when agents try to       │
│  Glob patterns, deny      │ │  happens. CLI dashboard   │ │  access restricted        │
│  lists, fine control.     │ │  or web UI.               │ │  paths.                   │
│                           │ │                           │ │                           │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

---

## TWITTER/X LAUNCH THREAD

### Tweet 1 (Hook)
```
I've been paranoid about AI coding agents.

"Wait, can Claude Code see my .env file right now?"
"Did Cursor just try to access something it shouldn't?"

So I built something to fix it.

Introducing AgentLeash
```

### Tweet 2 (Problem)
```
The problem with AI coding agents:

They're incredibly powerful.
They can read/write any file.
You have ZERO visibility.

You trust them because you have to.
But you don't really know what they're doing.
```

### Tweet 3 (Solution)
```
AgentLeash gives you control:

1. Define boundaries in .agentleash.yml
2. Run `leash watch`
3. See every file operation in real-time
4. Get alerts when agents cross the line

Simple. Local-first. No compromise on security.
```

### Tweet 4 (Demo)
```
Here's what it looks like:

[Screenshot of CLI watch mode]

Every file access. Color-coded.
Green = allowed
Red = blocked
Yellow = warning

Zero guesswork.
```

### Tweet 5 (VaultAgent Integration)
```
Even better: AgentLeash pairs with VaultAgent.

VaultAgent = protects secrets FROM agents
AgentLeash = protects systems FROM agents

Together = complete AI agent security stack

Bundle both and save 15%.
```

### Tweet 6 (CTA)
```
Try it free:
agentleash.io

- 1 scope
- 1,000 logs/day
- Basic monitoring
- No credit card

Pro is $19/mo when you're ready.

Built with the Veridian philosophy:
No tracking. No bloat. Just tools that work.
```

---

## HN LAUNCH POST

### Title
```
Show HN: AgentLeash – Define what AI coding agents can access on your system
```

### Post
```
Hey HN,

I built AgentLeash because I was getting paranoid about AI coding agents.

I use Claude Code and Cursor daily. They're amazing. But I realized I had no idea what they were actually doing with my file system. Could they read my .env? My SSH keys? I didn't know.

AgentLeash is a simple solution:

1. Create a .agentleash.yml file defining path permissions
2. Run `leash watch`
3. See every file operation in real-time
4. Get alerts when agents try to access restricted paths

Example config:

    rules:
      - path: "src/**"
        allow: [read, write]
      - path: ".env*"
        deny: [read, write, delete]
        reason: "Environment secrets"

The CLI gives you a real-time view of everything happening:

    14:32:01  [/]  READ   src/app.ts
    14:32:05  [X]  READ   .env.local  [BLOCKED]

Technical notes:
- Uses chokidar for file watching
- Glob patterns for path matching
- WebSocket for real-time updates to web dashboard
- No actual blocking (can't intercept at OS level), but full visibility + alerting

This pairs with my other project, VaultAgent (protects secrets FROM agents). Together they form a complete AI agent security stack.

Free tier: 1 scope, 1,000 logs/day
Pro: $19/mo for more scopes and logs

Would love feedback, especially on the permission model and what additional features would be useful.

Site: agentleash.io
GitHub: github.com/skygkruger/agentleash
```

---

## EMAIL SEQUENCES

### Welcome Email (After Signup)
```
Subject: Welcome to AgentLeash - Let's secure your first project

Hey {name},

Thanks for signing up for AgentLeash. You're now in control of what AI agents can access.

Here's how to get started in 2 minutes:

1. Install the CLI:
   npm install -g agentleash

2. Initialize your first scope:
   cd your-project && leash init

3. Start watching:
   leash watch

That's it. You'll see every file operation in real-time.

Need help? Reply to this email or check our docs at agentleash.io/docs.

Building in public,
[Your name]
Founder, Veridian Tools

P.S. AgentLeash pairs perfectly with VaultAgent for complete AI security. Bundle both and save 15%.
```

### Day 3 Email (Engagement)
```
Subject: Are you seeing what AI agents do to your files?

Hey {name},

Quick check-in: Have you run `leash watch` yet?

If you have, you've probably seen something like:

  14:32:01  [/]  READ   src/components/Button.tsx
  14:32:02  [/]  WRITE  src/components/Button.tsx
  14:32:05  [X]  READ   .env.local  [BLOCKED]

That third line? That's why AgentLeash exists.

Most developers don't realize their AI coding agents are trying to read sensitive files constantly. Now you can see it - and block it.

Not started yet? Here's the fastest way:

  leash init
  leash watch

Two commands. Full visibility.

Reply if you have questions,
[Your name]
```

### Day 7 Email (Upgrade Prompt)
```
Subject: You've logged {X} operations this week

Hey {name},

This week, AgentLeash tracked {X} file operations in your projects.

Here's your breakdown:
- Allowed: {allowed}
- Blocked: {blocked}
- Warnings: {warnings}

{If blocked > 0}
You blocked {blocked} potentially risky operations. Nice work.
{/If}

Ready for more? AgentLeash Pro gives you:
- 5 scopes (instead of 1)
- 10,000 logs/day (instead of 1,000)
- Export logs for compliance
- Priority support

Just $19/mo. Upgrade here: agentleash.io/upgrade

Or keep using the free tier - totally fine. We're here to help either way.

[Your name]
```

---

## VERIDIAN HUB ENTRY

### For veridiantools.dev
```yaml
product:
  name: AGENTLEASH
  tagline: "// AI Agent Permission Controller"
  description: "AI agents are powerful. They shouldn't have unlimited access. Define path boundaries, monitor operations, get alerts."
  color: "#d4a76a"  # Amber
  url: "https://agentleash.io"
  status: "live"

features:
  - "[/] Path boundaries"
  - "[/] Real-time monitoring"
  - "[/] Violation alerts"

ascii_logo: |
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

---

## KEY MESSAGING POINTS

### For Developers
- "See what AI agents are actually doing"
- "Finally, visibility into agent file access"
- "Your .env is safe now"
- "One config file. Full control."

### For Teams
- "Audit trail for AI agent activity"
- "Compliance-ready logging"
- "Team-wide security policies"
- "Know what your agents touched"

### For Enterprise
- "AI governance made simple"
- "Compliance reports out of the box"
- "SSO and team management"
- "On-prem deployment available"

### The Veridian Way
- No tracking. No bloat.
- Open source CLI.
- Honest pricing.
- Built by a developer, for developers.
