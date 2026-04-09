/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Primary role families ───────────────────────────────────
        cyan: {
          50: '#fafafa',
          100: '#f0f0f0',
          200: '#e5e5e5',
          400: '#3a3a3a',
          500: '#1f1f1f',
          600: '#141414',
          700: '#000000',
        },
        coral: {
          50: '#f8f8f8',
          100: '#efefef',
          200: '#dddddd',
          400: '#4a4a4a',
          500: '#2a2a2a',
          600: '#1a1a1a',
          700: '#050505',
        },
        lime: {
          50: '#f9f9f9',
          100: '#f0f0f0',
          200: '#dcdcdc',
          400: '#525252',
          500: '#353535',
          600: '#252525',
          700: '#111111',
        },
        gold: {
          50: '#f9f9f9',
          100: '#f1f1f1',
          200: '#dfdfdf',
          400: '#5c5c5c',
          500: '#3d3d3d',
          600: '#2b2b2b',
          700: '#181818',
        },
        magenta: {
          50: '#fbfbfb',
          100: '#f3f3f3',
          200: '#e2e2e2',
          400: '#666666',
          500: '#454545',
          600: '#303030',
          700: '#1a1a1a',
        },

        // ── Accent aliases (backward compatible) ───────────────────
        accent: {
          DEFAULT: '#141414',
          400: '#3a3a3a',
          500: '#1f1f1f',
          600: '#000000',
          hover: '#000000',
          'hover-dark': '#f0f0f0',
          muted: 'rgba(20, 20, 20, 0.12)',
        },

        // ── Semantic status colors ────────────────────────────────────
        success: {
          DEFAULT: '#22C55E',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          light: '#DCFCE7',
          muted: 'rgba(34, 197, 94, 0.14)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          light: '#FFFBEB',
          muted: 'rgba(245, 158, 11, 0.14)',
        },
        danger: {
          DEFAULT: '#EF4444',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          light: '#FEE2E2',
          muted: 'rgba(239, 68, 68, 0.14)',
        },
        info: {
          DEFAULT: '#1F1F1F',
          500: '#1F1F1F',
          600: '#000000',
          light: '#F3F3F3',
        },

        // ── Dark surfaces (updated for glassmorphism) ──
        dark: {
          bg: '#050505',
          surface: '#0F0F0F',
          surface2: '#1A1A1A',
          surface3: '#252525',
          border: '#3A3A3A',
        },
        // ── Light surfaces (updated for glassmorphism) ──
        light: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          surface2: '#F5F5F5',
          surface3: '#F0F0F0',
          border: '#E5E5E5',
        },

        // ── Legacy aliases (keeps all existing Tailwind class refs working) ──
        primary: {
          50: '#fafafa',
          100: '#f0f0f0',
          200: '#e5e5e5',
          300: '#cfcfcf',
          400: '#8f8f8f',
          500: '#4d4d4d',
          600: '#2a2a2a',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0f0f0f',
          950: '#000000',
        },
      },

      fontFamily: {
        // Primary text stack — matches body CSS variable
        sans: [
          '"Inter"',
          'sans-serif',
        ],
        // Display / headings stack
        display: [
          '"Inter"',
          'sans-serif',
        ],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        // Avenor type scale
        'display': ['clamp(48px, 6vw, 72px)', { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'h1':      ['clamp(36px, 4vw, 48px)',  { lineHeight: '1.08', letterSpacing: '-0.04em'  }],
        'h2':      ['clamp(24px, 3vw, 32px)',  { lineHeight: '1.12', letterSpacing: '-0.035em' }],
        'h3':      ['clamp(18px, 2vw, 24px)',  { lineHeight: '1.2',  letterSpacing: '-0.01em'  }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body':    ['16px', { lineHeight: '1.6' }],
        'small':   ['13px', { lineHeight: '1.4' }],
      },

      borderRadius: {
        'card':  '16px',
        'panel': '24px',
        'input': '12px',
        'pill':  '999px',
      },

      spacing: {
        // 8px grid system
        'xs':  '4px',
        'sm':  '8px',
        'md':  '16px',
        'lg':  '24px',
        'xl':  '32px',
        '2xl': '48px',
        '3xl': '64px',
      },

      maxWidth: {
        'content': '1280px',
      },

      backdropBlur: {
        'nav': '18px',
        'glass': '11px',
        'glass-light': '9px',
        'glass-heavy': '14px',
      },

      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)',
        'hover': '0 6px 20px rgba(0, 0, 0, 0.10), 0 8px 32px rgba(0, 0, 0, 0.08)',
        'soft-dark': '0 4px 16px rgba(0, 0, 0, 0.60), 0 0 0 1px rgba(255, 255, 255, 0.10)',
        'hover-dark': '0 12px 40px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.14)',
        'glass': '0 4px 16px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 24px rgba(0, 0, 0, 0.60), 0 0 0 1px rgba(255, 255, 255, 0.10)',
        // Legacy aliases
        'glow-sm': '0 0 15px rgba(255, 255, 255, 0.12)',
        'glow-md': '0 0 30px rgba(255, 255, 255, 0.14)',
        'glow-lg': '0 0 60px rgba(255, 255, 255, 0.16)',
        'card-dark':  '0 4px 24px rgba(0,0,0,0.40)',
        'card-light': '0 4px 24px rgba(0,0,0,0.08)',
      },

      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },

      transitionDuration: {
        'fast':   '180ms',
        'normal': '220ms',
      },

      animation: {
        'fade-in':    'fadeIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s linear infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'glass-hover': 'glassHover 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        glassHover: {
          '0%':   { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-4px) scale(1.004)', opacity: '1' },
        },
      },

      backgroundImage: {
        // Glassmorphism gradients
        'glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.65) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(15, 15, 15, 0.75) 0%, rgba(10, 10, 10, 0.65) 100%)',
        // Hero gradients
        'hero-gradient-light': 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 50%, #F0F0F0 100%)',
        'hero-gradient-dark': 'linear-gradient(135deg, #0F0F0F 0%, #0A0A0A 50%, #050505 100%)',
        // Card and background patterns
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-primary': 'radial-gradient(ellipse at center, rgba(245, 245, 245, 0.16) 0%, transparent 70%)',
        'glow-primary-dark': 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}