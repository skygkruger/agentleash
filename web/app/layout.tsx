import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'ScopeAgent - AI Agent Permission Controller',
  description:
    'Define path boundaries for AI coding agents. See every file operation in real-time. Get alerts when agents try to access sensitive files.',
  keywords: [
    'AI',
    'agent',
    'security',
    'permissions',
    'file access',
    'monitoring',
    'Claude Code',
    'Cursor',
    'Copilot',
  ],
  authors: [{ name: 'Veridian Tools' }],
  openGraph: {
    title: 'ScopeAgent - AI Agent Permission Controller',
    description:
      'AI agents are powerful. ScopeAgent keeps them in line. Define path boundaries, monitor operations, get alerts.',
    url: 'https://scopeagent.io',
    siteName: 'ScopeAgent',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScopeAgent - AI Agent Permission Controller',
    description: 'AI agents are powerful. ScopeAgent keeps them in line.',
    creator: '@scopeagent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-scope-bg text-scope-text font-mono">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
