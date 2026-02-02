/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'media',
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          // Stadium atmosphere
          background: '#0a1628',   // deep navy - night stadium
          surface: '#0f1d32',      // slightly lighter navy for cards

          // Field greens
          field: {
            dark: '#1a472a',
            DEFAULT: '#2d5a3d',
            light: '#228B22',
          },

          // Endzone colors
          endzone: {
            red: '#c41e3a',
            blue: '#1e3a8a',
          },

          // Achievement colors
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',

          // UI colors
          primary: '#3B82F6',      // calm blue
          accent: '#10B981',       // green highlights
          text: '#F1F5F9',         // light text
          muted: '#94A3B8',        // muted gray
          border: '#1e3a5f',       // subtle border with blue tint

          // Win/Loss colors
          win: '#22c55e',
          loss: '#ef4444',
        },
        fontFamily: {
          sans: ["Inter", "ui-sans-serif", "system-ui"],
          display: ["Oswald", "ui-sans-serif", "system-ui"],
        },
        boxShadow: {
          'stadium': '0 0 60px rgba(59, 130, 246, 0.15), 0 0 100px rgba(59, 130, 246, 0.1)',
          'glow-green': '0 0 20px rgba(34, 197, 94, 0.4)',
          'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        },
        animation: {
          'touchdown': 'touchdown 0.5s ease-in-out',
          'score-reveal': 'scoreReveal 0.6s ease-out',
        },
        keyframes: {
          touchdown: {
            '0%, 100%': { transform: 'rotate(0deg)' },
            '25%': { transform: 'rotate(-5deg)' },
            '75%': { transform: 'rotate(5deg)' },
          },
          scoreReveal: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
    },
    plugins: [],
  };
