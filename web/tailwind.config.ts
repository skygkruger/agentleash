import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base
        'scope-bg': '#1a1a2e',
        'scope-bg-light': '#252542',
        'scope-bg-card': '#1f1f35',

        // Text
        'scope-text': '#e8e3e3',
        'scope-muted': '#6e6a86',

        // Accents
        'scope-amber': '#d4a76a',
        'scope-mint': '#a8d8b9',
        'scope-coral': '#eb6f92',
        'scope-lavender': '#c4a7e7',
        'scope-cyan': '#7eb8da',
        'scope-cream': '#ffe9b0',

        // Borders
        'scope-border': '#6e6a86',
        'scope-border-light': '#4a4a6a',
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
