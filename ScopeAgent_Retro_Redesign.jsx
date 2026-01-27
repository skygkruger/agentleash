'use client';

import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
//  SCOPEAGENT - PASTEL RETRO TERMINAL REDESIGN
//  Primary Accent: Warm Amber (#d4a76a)
// ═══════════════════════════════════════════════════════════════

export default function ScopeAgentRetro() {
  const [activeTab, setActiveTab] = useState(0);
  const [pathPattern, setPathPattern] = useState('');
  const [ruleType, setRuleType] = useState('allow');
  const [isCreating, setIsCreating] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [demoRules, setDemoRules] = useState([
    { id: 1, type: 'allow', path: 'src/**', operations: ['read', 'write'], reason: 'Source code access' },
    { id: 2, type: 'deny', path: '.env*', operations: ['read', 'write', 'delete'], reason: 'Environment secrets' },
    { id: 3, type: 'deny', path: '**/*.key', operations: ['read'], reason: 'Private keys' },
    { id: 4, type: 'warn', path: 'node_modules/**', operations: ['write', 'delete'], reason: 'Dependencies' },
  ]);
  const [accessLog, setAccessLog] = useState([
    { time: '14:32:01', operation: 'READ', path: 'src/components/Button.tsx', result: 'allowed', agent: 'claude-code' },
    { time: '14:32:02', operation: 'WRITE', path: 'src/components/Button.tsx', result: 'allowed', agent: 'claude-code' },
    { time: '14:32:05', operation: 'READ', path: '.env.local', result: 'blocked', agent: 'claude-code' },
    { time: '14:32:08', operation: 'READ', path: 'package.json', result: 'allowed', agent: 'cursor' },
    { time: '14:32:10', operation: 'DELETE', path: 'node_modules/lodash/index.js', result: 'warning', agent: 'cursor' },
  ]);
  const [violations, setViolations] = useState([
    { id: 1, severity: 'high', type: 'path_breach', description: 'Attempted to read .env.local', time: '14:32:05' },
    { id: 2, severity: 'medium', type: 'mass_delete', description: 'Attempted 12 deletions in node_modules', time: '14:30:22' },
  ]);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Simulated live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const operations = ['READ', 'WRITE', 'DELETE'];
      const paths = ['src/app.ts', 'src/utils/helpers.ts', 'README.md', 'package.json', '.gitignore'];
      const results = ['allowed', 'allowed', 'allowed', 'warning'];
      const agents = ['claude-code', 'cursor'];
      
      const newLog = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        operation: operations[Math.floor(Math.random() * operations.length)],
        path: paths[Math.floor(Math.random() * paths.length)],
        result: results[Math.floor(Math.random() * results.length)],
        agent: agents[Math.floor(Math.random() * agents.length)],
      };
      
      setAccessLog(prev => [newLog, ...prev.slice(0, 9)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCreateRule = async () => {
    if (!pathPattern.trim()) return;
    setIsCreating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setDemoRules(prev => [...prev, {
      id: prev.length + 1,
      type: ruleType,
      path: pathPattern,
      operations: ['read', 'write'],
      reason: 'User created rule'
    }]);
    setPathPattern('');
    setIsCreating(false);
  };

  const tabs = ['MONITOR', 'RULES', 'VIOLATIONS'];

  return (
    <div 
      className="min-h-screen font-mono text-sm"
      style={{ 
        backgroundColor: '#1a1a2e',
        color: '#a8b2c3'
      }}
    >
      {/* ═══════════════════════════════════════════════════════ */}
      {/*                       HEADER                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      
      <header className="border-b" style={{ borderColor: '#6e6a86' }}>
        <div className="max-w-4xl mx-auto px-4">
          <pre className="text-xs py-2" style={{ color: '#d4a76a' }}>
{`╔══════════════════════════════════════════════════════════════════════════════╗
║  SCOPEAGENT                                  [DOCS]  [PRICING]  [GITHUB]  [@]  ║
╚══════════════════════════════════════════════════════════════════════════════╝`}
          </pre>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/*                     ASCII LOGO                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="text-center" style={{ color: '#d4a76a' }}>
          <pre className="text-xs leading-tight inline-block">
{`
███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗██║     ██║   ██║██████╔╝█████╗  
╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝  
███████║╚██████╗╚██████╔╝██║     ███████╗
╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
`}
          </pre>
          <pre className="text-xs leading-tight inline-block mt-2" style={{ color: '#d4a76a' }}>
{`         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
         │ A ├─┤ G ├─┤ E ├─┤ N ├─┤ T │
         └───┘ └───┘ └───┘ └───┘ └───┘`}
          </pre>
          <p className="text-xs tracking-widest mt-4" style={{ color: '#c4a7e7' }}>
            ·:·:· AI AGENT PERMISSION CONTROLLER v1.0 ·:·:·
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                      TAGLINE                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="text-center space-y-2">
          <p style={{ color: '#e8e3e3' }}>
            AI agents are powerful. ScopeAgent keeps them in line.
          </p>
          <p className="text-xs" style={{ color: '#6e6a86' }}>
            // path boundaries, real-time monitoring, violation alerts
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    TAB NAVIGATION                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div style={{ color: '#d4a76a' }}>
          <pre className="text-xs">
{`┌${'─'.repeat(tabs.map(t => t.length + 4).reduce((a, b) => a + b, tabs.length - 1))}┐`}
          </pre>
          <div className="flex">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className="transition-colors"
                style={{
                  color: activeTab === i ? '#d4a76a' : '#6e6a86',
                  backgroundColor: activeTab === i ? '#252542' : 'transparent',
                }}
              >
                <pre className="text-xs px-2">
                  {activeTab === i ? `[${tab}]` : ` ${tab} `}
                </pre>
              </button>
            ))}
          </div>
          <pre className="text-xs">
{`└${'─'.repeat(tabs.map(t => t.length + 4).reduce((a, b) => a + b, tabs.length - 1))}┘`}
          </pre>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    TAB CONTENT                          */}
        {/* ═══════════════════════════════════════════════════════ */}

        {activeTab === 0 && (
          <div className="space-y-6">
            {/* Scope Info */}
            <div style={{ color: '#a8b2c3' }}>
              <pre className="text-xs leading-tight">
{`┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  SCOPE: my-project-scope                                       [WATCHING]   │
│  PATH:  /Users/dev/projects/myapp                                           │
│  RULES: ${demoRules.length} active                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div style={{ color: '#a8d8b9' }}>
                <pre className="text-xs leading-tight">
{`┌────────────────────┐
│                    │
│    ALLOWED: 142    │
│    [/] operations  │
│                    │
└────────────────────┘`}
                </pre>
              </div>
              <div style={{ color: '#eb6f92' }}>
                <pre className="text-xs leading-tight">
{`┌────────────────────┐
│                    │
│    BLOCKED: 3      │
│    [X] violations  │
│                    │
└────────────────────┘`}
                </pre>
              </div>
              <div style={{ color: '#ffe9b0' }}>
                <pre className="text-xs leading-tight">
{`┌────────────────────┐
│                    │
│    WARNINGS: 7     │
│    [!] alerts      │
│                    │
└────────────────────┘`}
                </pre>
              </div>
            </div>

            {/* Real-time Access Log */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6e6a86' }}>// REAL-TIME ACCESS LOG</p>
              <div style={{ color: '#a8b2c3' }}>
                <pre className="text-xs leading-tight">
{`┌──────────────────────────────────────────────────────────────────────────────┐
│  TIME        RESULT  OP       PATH                              AGENT        │
├──────────────────────────────────────────────────────────────────────────────┤`}
                </pre>
                {accessLog.slice(0, 8).map((log, i) => (
                  <pre 
                    key={i} 
                    className="text-xs"
                    style={{ 
                      color: log.result === 'blocked' ? '#eb6f92' : 
                             log.result === 'warning' ? '#ffe9b0' : '#a8d8b9'
                    }}
                  >
{`│  ${log.time}   ${log.result === 'allowed' ? '[/]' : log.result === 'blocked' ? '[X]' : '[!]'}     ${log.operation.padEnd(8)} ${log.path.padEnd(35).slice(0, 35)} ${log.agent.padEnd(10)} │`}
                  </pre>
                ))}
                <pre className="text-xs" style={{ color: '#a8b2c3' }}>
{`└──────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-6">
            {/* Add Rule Form */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6e6a86' }}>// ADD NEW RULE</p>
              <div style={{ color: '#a8b2c3' }}>
                <pre className="text-xs">
{`┌──────────────────────────────────────────────────────────────────────────────┐`}
                </pre>
                <div className="px-4 py-3" style={{ backgroundColor: '#252542' }}>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-xs" style={{ color: '#6e6a86' }}>Type:</span>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value)}
                      className="bg-transparent border px-2 py-1 text-xs"
                      style={{ borderColor: '#6e6a86', color: '#d4a76a' }}
                    >
                      <option value="allow" style={{ backgroundColor: '#1a1a2e' }}>ALLOW</option>
                      <option value="deny" style={{ backgroundColor: '#1a1a2e' }}>DENY</option>
                      <option value="warn" style={{ backgroundColor: '#1a1a2e' }}>WARN</option>
                    </select>
                    <span className="text-xs" style={{ color: '#6e6a86' }}>Path Pattern:</span>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={pathPattern}
                        onChange={(e) => setPathPattern(e.target.value)}
                        placeholder="e.g., src/** or *.env"
                        className="w-full bg-transparent border px-2 py-1 text-xs"
                        style={{ 
                          borderColor: '#6e6a86',
                          color: '#e8e3e3',
                        }}
                      />
                      <span 
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        style={{ 
                          color: '#d4a76a',
                          opacity: cursorVisible && !pathPattern ? 1 : 0
                        }}
                      >
                        _
                      </span>
                    </div>
                    <button
                      onClick={handleCreateRule}
                      disabled={isCreating || !pathPattern.trim()}
                      className="border px-3 py-1 text-xs transition-colors"
                      style={{ 
                        borderColor: '#d4a76a',
                        color: isCreating ? '#6e6a86' : '#d4a76a',
                      }}
                    >
                      {isCreating ? '[...]' : '[+] ADD'}
                    </button>
                  </div>
                </div>
                <pre className="text-xs">
{`└──────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </div>

            {/* Active Rules */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6e6a86' }}>// ACTIVE RULES ({demoRules.length})</p>
              <div style={{ color: '#a8b2c3' }}>
                <pre className="text-xs leading-tight">
{`┌──────────────────────────────────────────────────────────────────────────────┐
│  #   TYPE    PATH PATTERN              OPERATIONS          REASON            │
├──────────────────────────────────────────────────────────────────────────────┤`}
                </pre>
                {demoRules.map((rule, i) => (
                  <pre 
                    key={rule.id} 
                    className="text-xs"
                    style={{ 
                      color: rule.type === 'allow' ? '#a8d8b9' : 
                             rule.type === 'deny' ? '#eb6f92' : '#ffe9b0'
                    }}
                  >
{`│  ${(i + 1).toString().padEnd(3)} ${rule.type === 'allow' ? '[/]' : rule.type === 'deny' ? '[X]' : '[!]'} ${rule.type.toUpperCase().padEnd(4)} ${rule.path.padEnd(25).slice(0, 25)} ${rule.operations.join(', ').padEnd(18).slice(0, 18)} ${rule.reason.padEnd(15).slice(0, 15)} │`}
                  </pre>
                ))}
                <pre className="text-xs" style={{ color: '#a8b2c3' }}>
{`└──────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </div>

            {/* Test Rule */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6e6a86' }}>// TEST PATH</p>
              <div style={{ color: '#a8b2c3' }}>
                <pre className="text-xs leading-tight">
{`┌──────────────────────────────────────────────────────────────────────────────┐
│  Path: [src/app.ts_______________________]  Op: [read]  [TEST]               │
│                                                                              │
│  Result: [/] ALLOWED by rule #1 (src/**)                                     │
└──────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-6">
            {/* Violation Summary */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6e6a86' }}>// VIOLATION SUMMARY</p>
              <div className="grid grid-cols-4 gap-4">
                <div style={{ color: '#eb6f92' }}>
                  <pre className="text-xs leading-tight text-center">
{`┌─────────────┐
│  CRITICAL   │
│      0      │
└─────────────┘`}
                  </pre>
                </div>
                <div style={{ color: '#f5a97f' }}>
                  <pre className="text-xs leading-tight text-center">
{`┌─────────────┐
│    HIGH     │
│      1      │
└─────────────┘`}
                  </pre>
                </div>
                <div style={{ color: '#ffe9b0' }}>
                  <pre className="text-xs leading-tight text-center">
{`┌─────────────┐
│   MEDIUM    │
│      1      │
└─────────────┘`}
                  </pre>
                </div>
                <div style={{ color: '#a8d8b9' }}>
                  <pre className="text-xs leading-tight text-center">
{`┌─────────────┐
│    LOW      │
│      0      │
└─────────────┘`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Recent Violations */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6e6a86' }}>// RECENT VIOLATIONS</p>
              {violations.map((v) => (
                <div key={v.id} className="mb-4">
                  <pre 
                    className="text-xs leading-tight"
                    style={{ 
                      color: v.severity === 'high' ? '#eb6f92' : 
                             v.severity === 'medium' ? '#ffe9b0' : '#a8b2c3'
                    }}
                  >
{`╔══════════════════════════════════════════════════════════════════════════════╗
║  [!] ${v.severity.toUpperCase()} - ${v.type.toUpperCase().padEnd(50)} ${v.time}  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ${v.description.padEnd(74)} ║
║                                                                              ║
║  [ ] Acknowledge                                                   [DETAILS] ║
╚══════════════════════════════════════════════════════════════════════════════╝`}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    FEATURES                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="space-y-3 pt-8">
          <p className="text-xs" style={{ color: '#6e6a86' }}>// WHY SCOPEAGENT</p>
          
          <div className="grid grid-cols-3 gap-4">
            <div style={{ color: '#d4a76a' }}>
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [#] PATH BOUNDARIES    │
│                           │
│  Define exactly what      │
│  AI agents can access.    │
│  Glob patterns, deny      │
│  lists, fine control.     │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
            
            <div style={{ color: '#c4a7e7' }}>
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [>] REAL-TIME VIEW     │
│                           │
│  See every file           │
│  operation as it          │
│  happens. Full            │
│  visibility.              │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
            
            <div style={{ color: '#7eb8da' }}>
              <pre className="text-xs leading-tight">
{`┌───────────────────────────┐
│                           │
│    [!] ALERTS             │
│                           │
│  Get notified when        │
│  agents try to            │
│  access sensitive         │
│  files or paths.          │
│                           │
└───────────────────────────┘`}
              </pre>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                  INTEGRATIONS                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#6e6a86' }}>// SUPPORTED AGENTS</p>
          
          <div style={{ color: '#a8b2c3' }}>
            <pre className="text-xs leading-tight">
{`┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ CLAUDE CODE │  │   CURSOR    │  │   COPILOT   │  │   WINDSURF  │        │
│   │   [/] yes   │  │   [/] yes   │  │   [~] soon  │  │   [~] soon  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│   $ scopeagent init                                                          │
│   $ scopeagent watch                                                         │
│   [WATCHING] src/app.ts READ allowed                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                VAULTAGENT INTEGRATION                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#6e6a86' }}>// COMPLETE AI AGENT SECURITY STACK</p>
          
          <div style={{ color: '#a8b2c3' }}>
            <pre className="text-xs leading-tight">
{`╔══════════════════════════════════════════════════════════════════════════════╗
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
╚══════════════════════════════════════════════════════════════════════════════╝`}
            </pre>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                    PRICING                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#6e6a86' }}>// PRICING</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div style={{ color: '#a8b2c3' }}>
              <pre className="text-xs leading-tight">
{`┌────────────────────────────────┐
│                                │
│           FREE                 │
│           $0/mo                │
│                                │
│  [/] 1 scope                   │
│  [/] 1,000 logs/day            │
│  [/] Basic monitoring          │
│  [/] Community support         │
│                                │
│       [GET STARTED]            │
│                                │
└────────────────────────────────┘`}
              </pre>
            </div>
            
            <div style={{ color: '#d4a76a' }}>
              <pre className="text-xs leading-tight">
{`╔════════════════════════════════╗
║                                ║
║           PRO                  ║
║           $15/mo               ║
║                                ║
║  [/] 5 scopes                  ║
║  [/] 10,000 logs/day           ║
║  [/] Custom rules              ║
║  [/] Export logs               ║
║  [/] Priority support          ║
║                                ║
║       [UPGRADE TO PRO]         ║
║                                ║
╚════════════════════════════════╝`}
              </pre>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div style={{ color: '#c4a7e7' }}>
              <pre className="text-xs leading-tight">
{`┌────────────────────────────────┐
│                                │
│           TEAM                 │
│           $49/mo               │
│                                │
│  [/] 20 scopes                 │
│  [/] 100,000 logs/day          │
│  [/] Team sharing              │
│  [/] Webhooks                  │
│  [/] API access                │
│                                │
│       [CONTACT SALES]          │
│                                │
└────────────────────────────────┘`}
              </pre>
            </div>
            
            <div style={{ color: '#a8b2c3' }}>
              <pre className="text-xs leading-tight">
{`┌────────────────────────────────┐
│                                │
│         ENTERPRISE             │
│         $149/mo                │
│                                │
│  [/] Unlimited scopes          │
│  [/] Unlimited logs            │
│  [/] SSO/SAML                  │
│  [/] Compliance reports        │
│  [/] Dedicated support         │
│                                │
│       [CONTACT SALES]          │
│                                │
└────────────────────────────────┘`}
              </pre>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*                      FAQ                                */}
        {/* ═══════════════════════════════════════════════════════ */}
        
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#6e6a86' }}>// FAQ</p>
          
          <div className="space-y-2" style={{ color: '#a8b2c3' }}>
            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#d4a76a' }}>
                <pre className="text-xs inline">
{`[?] Can ScopeAgent actually prevent file access?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
{`    ScopeAgent monitors and logs all access. It can't prevent operations
    at the OS level, but it provides full visibility and alerts you to
    violations so you can take action.`}
              </pre>
            </details>
            
            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#d4a76a' }}>
                <pre className="text-xs inline">
{`[?] What's the difference from ScopeAgent and VaultAgent?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
{`    VaultAgent protects your SECRETS from AI agents (API keys, passwords).
    ScopeAgent protects your SYSTEM from AI agents (file access, paths).
    Together they form a complete AI security stack.`}
              </pre>
            </details>
            
            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#d4a76a' }}>
                <pre className="text-xs inline">
{`[?] Does it slow down my development?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
{`    No. The daemon runs efficiently in the background with minimal
    resource usage. File watching is optimized for high-frequency
    events like build processes.`}
              </pre>
            </details>
            
            <details className="group">
              <summary className="cursor-pointer" style={{ color: '#d4a76a' }}>
                <pre className="text-xs inline">
{`[?] Which AI coding agents are supported?`}
                </pre>
              </summary>
              <pre className="text-xs pl-4 pt-2" style={{ color: '#a8b2c3' }}>
{`    Currently Claude Code and Cursor with full support. GitHub Copilot
    and Windsurf support coming soon. Any tool that accesses your file
    system will be monitored.`}
              </pre>
            </details>
          </div>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*                      FOOTER                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      
      <footer className="border-t mt-16" style={{ borderColor: '#6e6a86' }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <pre className="text-xs text-center" style={{ color: '#6e6a86' }}>
{`
═══════════════════════════════════════════════════════════════════════════════

                        KEEPING AI AGENTS IN CHECK

                             (c) 2025 SCOPEAGENT
                         
            [HOME]  [DOCS]  [PRICING]  [GITHUB]  [TWITTER]  [CONTACT]

                        Part of the Veridian family

═══════════════════════════════════════════════════════════════════════════════
`}
          </pre>
        </div>
      </footer>
    </div>
  );
}
