import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#f4f0e8',
        panel: '#2a2720',
        line: '#4a4338',
      },
      fontFamily: {
        sans: ['var(--font-dm)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fr)', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        pop: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-0.5deg)' },
          '50%': { transform: 'rotate(0.5deg)' },
        },
      },
      animation: {
        pop: 'pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        wiggle: 'wiggle 0.35s ease-in-out',
      },
      boxShadow: {
        lift: '0 3px 0 0 rgba(0,0,0,0.35)',
        liftSm: '0 2px 0 0 rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
