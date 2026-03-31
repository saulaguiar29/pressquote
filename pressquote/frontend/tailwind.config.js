/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#052e16',
          900: '#14532d',
          800: '#166534',
          700: '#15803d',
          600: '#16a34a',
          500: '#22c55e',
          400: '#4ade80',
          300: '#86efac',
          200: '#bbf7d0',
          100: '#dcfce7',
          50:  '#f0fdf4',
        },
        // Remap navy to light tones for main content area
        navy: {
          950: '#f0fdf4',
          900: '#f8fafb',
          800: '#ffffff',
          700: '#f0f7f3',
          600: '#e8f4ed',
          500: '#d1fae5',
          400: '#c8ddd0',
        },
        // Remap blue to green for primary actions
        blue: {
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
        },
        surface: '#f5f9f6',
        card: '#ffffff',
        border: '#d1e7da',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(22, 163, 74, 0.15)',
        'glow-sm': '0 0 10px rgba(22, 163, 74, 0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
