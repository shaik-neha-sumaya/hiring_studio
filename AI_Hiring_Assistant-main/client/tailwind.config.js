/**
 * Shared visual tokens for the light SaaS workspace.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        plane: '#FFFCF2',
        surface: '#FFFFFF',
        raised: '#F7F7F7',
        inset: '#FCFCFC',
        line: '#EAEAEA',
        edge: '#D4D4D4',
        ink: '#1A1A1A',
        'ink-2': '#4F4F4F',
        muted: '#6B6B6B',
        accent: {
          DEFAULT: '#FFD600',
          soft: '#FFD600',
          ring: '#FFD600',
        },
        series: {
          1: '#FFD600',
          2: '#b84d28',
          3: '#19836b',
        },
        good: '#167653',
        warning: '#FFD600',
        serious: '#b84d28',
        critical: '#b42318',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '10px' },
      boxShadow: {
        card: '0 1px 2px rgba(26, 26, 26, 0.04), 0 10px 24px -18px rgba(26, 26, 26, 0.14)',
        lift: '0 16px 36px -18px rgba(26, 26, 26, 0.16)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up 0.32s ease-out both',
      },
    },
  },
  plugins: [],
};
