# SCOPEAGENT PROJECT PACKAGE
## v1.0 - January 2025

```
███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗  
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝  
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘
```

---

## PACKAGE CONTENTS

| File | Purpose |
|------|---------|
| `ScopeAgent_Retro_Redesign.jsx` | Complete landing page / dashboard UI component |
| `CLAUDE_CODE_BUILD_PROMPT.md` | Full build instructions for Claude Code (THE MAIN FILE) |
| `README.md` | Project overview and quick start guide |
| `.scopeagent.example.yml` | Example configuration file |
| `.env.example` | Environment variables template |
| `SCOPEAGENT_MARKETING_COPY.md` | Product Hunt, Twitter, HN launch copy |
| `SCOPEAGENT_LOGO_COLLECTION.md` | ASCII logos and design assets |

---

## HOW TO USE THIS PACKAGE

### Step 1: Read the Build Prompt
Open `CLAUDE_CODE_BUILD_PROMPT.md` - this is the master document containing:
- Complete architecture overview
- Database schema (copy to Supabase)
- Phased build prompts for Claude Code
- API endpoints specification
- CLI commands specification
- Dashboard design patterns

### Step 2: Start Building with Claude Code
1. Create a new project directory
2. Open Claude Code: `claude`
3. Feed it the prompts from `CLAUDE_CODE_BUILD_PROMPT.md` in order
4. Each phase builds on the previous

### Step 3: Configure Your Environment
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase, Stripe credentials
3. Run the database schema in Supabase SQL Editor

### Step 4: Use the UI Component
The `ScopeAgent_Retro_Redesign.jsx` file is a complete React component that:
- Matches the Pastel Retro Terminal design system
- Includes interactive demo functionality
- Can be used as-is or customized

### Step 5: Launch Marketing
Use `SCOPEAGENT_MARKETING_COPY.md` for:
- Product Hunt launch
- Twitter/X thread
- Hacker News post
- Email sequences

---

## DESIGN SYSTEM QUICK REFERENCE

### Colors
```
Background:  #1a1a2e
Text:        #e8e3e3
Muted:       #6e6a86
Amber:       #d4a76a (ScopeAgent primary)
Mint:        #a8d8b9 (allowed/success)
Coral:       #eb6f92 (blocked/error)
Cream:       #ffe9b0 (warning)
Lavender:    #c4a7e7 (info)
Cyan:        #7eb8da (links)
```

### Typography
- Font: JetBrains Mono / Fira Code
- No emojis
- ASCII art only
- Box-drawing characters for borders

### Status Icons
```
[/] = Allowed (mint)
[X] = Blocked (coral)
[!] = Warning (cream)
[?] = Help/FAQ (amber)
[+] = Add/New (amber)
[#] = Config (amber)
[>] = Action (lavender)
[*] = Active (amber)
[~] = Pending (muted)
```

---

## VAULTAGENT INTEGRATION

ScopeAgent is designed to pair with VaultAgent:

| Product | Protects | From |
|---------|----------|------|
| VaultAgent | Secrets | AI agents |
| ScopeAgent | Systems | AI agents |

Bundle pricing: $20/mo (save 15%)

Cross-selling points:
- Dashboard upsell if user doesn't have both
- CLI tip: "Add VaultAgent for secret protection"
- Landing page: "Complete your security stack"

---

## PRICING MODEL

| Tier | Scopes | Logs/day | Price |
|------|--------|----------|-------|
| Free | 1 | 1,000 | $0 |
| Pro | 5 | 10,000 | $15/mo |
| Team | 20 | 100,000 | $49/mo |
| Enterprise | ∞ | ∞ | $149/mo |

---

## ESTIMATED BUILD TIME

- Setup: 2-3 hours
- Daemon: 6-8 hours  
- API: 6-8 hours
- CLI: 4-6 hours
- Dashboard: 8-10 hours
- Integration: 2-3 hours
- Testing: 4-6 hours

**Total: ~40-50 hours (1-2 weeks)**

---

## SUPPORT

Questions about this package? The build prompt contains everything you need. Feed the prompts to Claude Code in sequence and it will build the entire system.

Part of the Veridian family:
- RegexGPT (Cyan)
- PRoast (Coral)
- VaultAgent (Mint)
- **ScopeAgent (Amber)**
- ShipLog (Lavender)
- DeadCode Detective (Peach)
- ErrorStory (Cream)

---

```
═══════════════════════════════════════════════════════════════════════════════

                        KEEPING AI AGENTS IN CHECK

                             (c) 2025 SCOPEAGENT
                        Part of the Veridian family

═══════════════════════════════════════════════════════════════════════════════
```
