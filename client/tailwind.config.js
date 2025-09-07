/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'media',
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          background: '#0F172A', // global dark background
          surface: '#1E293B',    // card/table background
          primary: '#3B82F6',    // calm blue
          accent: '#10B981',     // green highlights
          text: '#F1F5F9',       // light text
          muted: '#94A3B8',      // muted gray
          border: '#334155',     // subtle border
        },
        fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      },
    },
    plugins: [],
  };
  