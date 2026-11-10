/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: colors.indigo,
        fake: colors.rose,
        genuine: colors.emerald,
        textual: colors.blue,
        behavioral: colors.amber,
        temporal: colors.purple,
        // Neutral palette refinements
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
          cardLight: '#ffffff',
          cardDark: '#1e293b',
          mutedLight: '#f8fafc',
          mutedDark: '#141e33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'soft-md': '0 4px 12px -1px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.07), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 20px 30px -5px rgba(0, 0, 0, 0.08), 0 8px 12px -3px rgba(0, 0, 0, 0.05)',
        'glow-primary': '0 0 20px -3px rgba(99, 102, 241, 0.25)',
        'glow-fake': '0 0 20px -3px rgba(244, 63, 94, 0.25)',
        'glow-genuine': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
      },
      borderRadius: {
        'card': '0.75rem', // 12px (rounded-xl)
      },
    },
  },
  plugins: [],
}
