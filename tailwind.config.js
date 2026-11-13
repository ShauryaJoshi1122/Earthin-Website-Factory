/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080D17',
        sidebar: '#101827',
        card: '#151F30',
        'card-border': '#1E2C42',
        primary: {
          DEFAULT: '#4F8CFF',
          hover: '#3D7AE8',
          subtle: 'rgba(79, 140, 255, 0.12)',
        },
        success: {
          DEFAULT: '#16A36A',
          subtle: 'rgba(22, 163, 106, 0.15)',
        },
        warning: {
          DEFAULT: '#F0A43B',
          subtle: 'rgba(240, 164, 59, 0.15)',
        },
        error: {
          DEFAULT: '#E34B5B',
          subtle: 'rgba(227, 75, 91, 0.15)',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
