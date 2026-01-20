import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary background gradient stops
        'bg-start': '#0a0a0f',
        'bg-end': '#1a1a2e',
        // Card surfaces
        'surface': 'rgba(255,255,255,0.03)',
        'surface-hover': 'rgba(255,255,255,0.06)',
        'surface-border': 'rgba(255,255,255,0.08)',
        // Accent colors
        'accent-indigo': '#6366f1',
        'accent-violet': '#8b5cf6',
        'accent-fuchsia': '#d946ef',
        // Text colors
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-tertiary': '#64748b',
        // Success/Status
        'success': '#34d399',
        'success-muted': 'rgba(52,211,153,0.2)',
        // Error
        'error': '#f87171',
        'error-muted': 'rgba(248,113,113,0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Spacious typography scale
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.6' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
      },
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.2)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'soft-lg': '0 8px 40px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
