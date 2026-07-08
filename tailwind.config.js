/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        christ: {
          navy: '#002147',      // Primary Christ University Navy
          gold: '#C5A059',      // Accent Gold
          darkNavy: '#001630',  // Deep Navy
          lightGold: '#E5C158', // Highlight Gold
          cream: '#FAF8F5',     // Soft Cream background
          slate: '#475569',     // Text muted
          lightBg: '#F8FAFC',   // Clean card/body background
          border: '#E2E8F0',    // Clean border
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'christ-card': '0 4px 20px -2px rgba(0, 33, 71, 0.08), 0 2px 6px -1px rgba(0, 33, 71, 0.04)',
        'christ-gold': '0 4px 14px 0 rgba(197, 160, 89, 0.39)',
        'christ-navy': '0 4px 14px 0 rgba(0, 33, 71, 0.35)',
      }
    },
  },
  plugins: [],
}
