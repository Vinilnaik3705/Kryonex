/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surfaces (CSS-var driven, supports light/dark)
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        tertiary: "var(--color-hover)",
        accent: "var(--color-accent)",
        success: "#10B981",
        danger: "#F43F5E",
        warning: "#F59E0B",
        border: "var(--color-border)",

        // Semantic color mappings
        card: "var(--color-card)",
        "text-main": "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "text-dim": "var(--color-text-dim)",

        // Brand tokens (static)
        brand: {
          50: '#241d46',
          100: '#33265f',
          200: '#4c3a88',
          300: '#6851b8',
          400: '#8b75e8',
          500: '#7c5cff',
          600: '#8d70ff',
          700: '#b9aaff',
          800: '#d4ccff',
          900: '#eeeaff',
        },
        violet: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 40px -10px rgba(99,102,241,0.45)',
        'glow-soft': '0 8px 40px -12px rgba(99,102,241,0.25)',
        'card': '0 1px 2px rgba(0,0,0,0.35), 0 18px 42px -24px rgba(0,0,0,0.9)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 20px 48px -16px rgba(124,92,255,0.22)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'aurora': 'auroraDrift 18s ease-in-out infinite alternate',
        'aurora-slow': 'auroraDrift 26s ease-in-out infinite alternate',
        'marquee': 'marquee 40s linear infinite',
        'marquee-reverse': 'marqueeReverse 40s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'spin-slow': 'spin 14s linear infinite',
        'gradient-x': 'gradientX 6s ease infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        auroraDrift: {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '0.7' },
          '33%': { transform: 'translate(8%, 6%) scale(1.1)', opacity: '0.9' },
          '66%': { transform: 'translate(-6%, 4%) scale(0.95)', opacity: '0.6' },
          '100%': { transform: 'translate(4%, -4%) scale(1.05)', opacity: '0.8' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeReverse: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
      }
    },
  },
  plugins: [],
}
