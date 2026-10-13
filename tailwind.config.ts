import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#090d10',
          900: '#0d1117',
          850: '#12181b',
          800: '#161b22',
          750: '#1c2228',
          700: '#21262d',
          600: '#30363d',
        },
        forest: {
          950: '#0a1715',
          900: '#122624',
          850: '#16312e',
          800: '#1a3835',
          700: '#244e49',
          600: '#336e67',
        },
        coral: {
          400: '#f09077',
          500: '#e07a5f',
          600: '#d96c4f',
          700: '#c2583b',
        },
        amberGold: {
          400: '#fbbf24',
          500: '#d97736',
          600: '#b45309',
        },
        accentGold: {
          400: '#fde047',
          500: '#e5a93b',
          600: '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(circle at 50% 50%, rgba(224, 122, 95, 0.05) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
