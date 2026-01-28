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
        // Base - Warmer dark tones
        'scope-bg': '#1a1814',
        'scope-bg-light': '#252219',
        'scope-bg-card': '#1f1c17',

        // Text
        'scope-text': '#e8e3db',
        'scope-muted': '#7a7267',

        // Primary - Gold/Amber (keep as iconic element)
        'scope-amber': '#d4a76a',
        'scope-gold': '#d4a76a',

        // 70s Palette - Warm earth tones
        'scope-rust': '#c56a4a',
        'scope-burnt': '#b85c38',
        'scope-terracotta': '#a65d3f',
        'scope-brown': '#5c3d2e',
        'scope-cream': '#f5e6c8',
        'scope-tan': '#d4c4a8',

        // Functional colors (keep for UI indicators)
        'scope-mint': '#a8d8b9',
        'scope-coral': '#eb6f92',

        // Borders - Warmer
        'scope-border': '#4a4238',
        'scope-border-light': '#3a352d',
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
        'sweep': 'sweep 0.5s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        sweep: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
