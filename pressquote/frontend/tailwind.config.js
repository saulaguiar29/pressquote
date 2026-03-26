/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040a15',
          900: '#060d1c',
          800: '#0a1428',
          700: '#0f1e3a',
          600: '#152647',
          500: '#1c3261',
          400: '#243d7a',
        },
        blue: {
          400: '#60a5fa',
          500: '#4b8eff',
          600: '#3b7de8',
        },
        surface: '#0d1729',
        card: '#111f38',
        border: '#1a2e52',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(75, 142, 255, 0.15)',
        'glow-sm': '0 0 10px rgba(75, 142, 255, 0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
