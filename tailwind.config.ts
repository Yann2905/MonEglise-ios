import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // SF Pro fallback : -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text"
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"SF Pro Display"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Cormorant Garamond"', 'serif'],
      },
      colors: {
        // ─── Palette MonÉglise (bleu marine du logo) ────────
        brand: {
          50: '#EEF3FB',
          100: '#D7E3F5',
          200: '#A8C2E8',
          300: '#7AA1DB',
          400: '#4D80CD',
          500: '#3D7CC9', // bleu accent
          600: '#234A87', // bleu marine principal
          700: '#1A3866',
          800: '#122546',
          900: '#0A1325',
        },
        // ─── Système iOS 18 ────────────────────────────────
        ios: {
          // Backgrounds (light + dark)
          bg: {
            light: '#F2F2F7',
            DEFAULT: '#FFFFFF',
            dark: '#000000',
            darkSecondary: '#1C1C1E',
            darkTertiary: '#2C2C2E',
          },
          // Card / grouped backgrounds
          card: {
            light: '#FFFFFF',
            dark: '#1C1C1E',
          },
          // Labels
          label: {
            light: '#000000',
            secondary: '#3C3C434D',
            tertiary: '#3C3C4399',
            dark: '#FFFFFF',
            darkSecondary: '#EBEBF54D',
          },
          // Séparateurs
          separator: '#3C3C434A',
          separatorDark: '#54545899',
          // Couleurs système Apple
          blue: '#007AFF',
          green: '#34C759',
          indigo: '#5856D6',
          orange: '#FF9500',
          pink: '#FF2D55',
          purple: '#AF52DE',
          red: '#FF3B30',
          teal: '#5AC8FA',
          yellow: '#FFCC00',
          gray: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          gray4: '#D1D1D6',
          gray5: '#E5E5EA',
          gray6: '#F2F2F7',
        },
      },
      borderRadius: {
        // Style "continuous" iOS (squircle)
        ios: '14px',
        'ios-lg': '18px',
        'ios-xl': '22px',
        'ios-2xl': '28px',
        'ios-3xl': '36px',
      },
      boxShadow: {
        // Ombres iOS douces
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'ios': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'ios-lg': '0 8px 24px rgba(0, 0, 0, 0.10)',
        'ios-xl': '0 20px 40px rgba(0, 0, 0, 0.12)',
        // Halo coloré (style Apple Intelligence)
        'ios-glow-blue': '0 0 40px rgba(0, 122, 255, 0.30)',
        'ios-glow-orange': '0 0 40px rgba(255, 149, 0, 0.30)',
      },
      backdropBlur: {
        ios: '20px',
        'ios-lg': '40px',
      },
      animation: {
        'spring-in': 'spring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        'spring-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      letterSpacing: {
        // Tracking SF Pro
        'sf-tight': '-0.022em',
        'sf-tighter': '-0.035em',
        'sf': '-0.015em',
      },
    },
  },
  plugins: [],
};

export default config;
