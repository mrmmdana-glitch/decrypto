/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#090a0f',
          1: '#0e0f18',
          2: '#13141f',
          3: '#191a29',
          4: '#20223a',
        },
        accent: {
          // Purple primary scale
          DEFAULT: '#8b5cf6',
          dim:     '#7c3aed',
          soft:    '#a78bfa',
          ghost:   'rgba(139,92,246,0.08)',
          // Legacy cyan kept as secondary
          cyan:    '#0891b2',
        },
        purple: {
          DEFAULT: '#8b5cf6',
          dim:     '#7c3aed',
          soft:    '#a78bfa',
          faint:   'rgba(139,92,246,0.12)',
        },
        risk: {
          critical: '#dc2626',
          high:     '#ea580c',
          medium:   '#d97706',
          low:      '#16a34a',
          unknown:  '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(139,92,246,0.25), 0 0 60px rgba(139,92,246,0.08)',
        'glow-purple-sm': '0 0 14px rgba(139,92,246,0.35)',
        'glow-cyan': '0 0 20px rgba(8,145,178,0.2)',
        'glow-red': '0 0 30px rgba(220,38,38,0.2), 0 0 60px rgba(220,38,38,0.06)',
        'glass': '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.12)',
        'glass-sm': '0 2px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scan-line': 'scanLine 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

