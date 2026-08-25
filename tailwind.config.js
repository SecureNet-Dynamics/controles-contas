/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: {
          DEFAULT: '#0A0B0E',
          hover: '#1A1C22',
          active: '#212429',
          border: '#1E2126',
          text: '#8A909B',
          'text-active': '#F5F6F7',
        },
        brand: {
          DEFAULT: '#5EA6E8',
          50: '#EFF6FC',
          100: '#DCEEFA',
          200: '#BFE0F5',
          300: '#96CBEC',
          400: '#6EB2E3',
          500: '#5EA6E8',
          600: '#3579B8',
          700: '#2A5F94',
          800: '#1F4770',
          900: '#16324F',
        },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          50: 'rgb(var(--surface-50) / <alpha-value>)',
          100: 'rgb(var(--surface-100) / <alpha-value>)',
          200: 'rgb(var(--surface-200) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        danger: {
          DEFAULT: '#FF6B6B',
          light: 'rgba(255,107,107,0.12)',
          dark: 'rgb(var(--danger-dark) / <alpha-value>)',
        },
        warning: {
          DEFAULT: '#F5A623',
          light: 'rgba(245,166,35,0.12)',
          dark: 'rgb(var(--warning-dark) / <alpha-value>)',
        },
        info: {
          DEFAULT: '#8C9EFF',
          light: 'rgba(140,158,255,0.12)',
          dark: 'rgb(var(--info-dark) / <alpha-value>)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'modal': 'var(--shadow-modal)',
        'brand': '0 4px 14px rgba(94,166,232,0.35)',
      },
    },
  },
  plugins: [],
}
