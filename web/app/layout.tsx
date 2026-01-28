import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://agentleash.io'),
  title: 'AgentLeash - AI Agent Access Control',
  description:
    'Monitor and control what files AI coding agents access in your projects. Full visibility, rule-based boundaries, real-time alerts.',
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
    'Windsurf',
    'Aider',
  ],
  authors: [{ name: 'Veridian Tools' }],
  openGraph: {
    title: 'AgentLeash - AI Agent Access Control',
    description:
      'Monitor and control what files AI coding agents access. Define boundaries, watch in real-time, get alerts.',
    url: 'https://agentleash.io',
    siteName: 'AgentLeash',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentLeash - AI Agent Access Control',
    description: 'Monitor and control what files AI coding agents access.',
    creator: '@agentleash',
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
