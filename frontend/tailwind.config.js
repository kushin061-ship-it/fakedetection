/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tl: {
          bg: '#F6F9FE',
          card: '#FFFFFF',
          fill: '#F7FAFE',
          border: '#E6ECF5',
          text: '#26324A',
          muted: '#6B7A93',
          sidebar: '#5B6B84',
          accent: '#3A78F2',
          'accent-end': '#74A6FF',
          'accent-bg': 'rgba(58, 120, 242, 0.14)',
          fake: '#E05A5A',
          'fake-bg': 'rgba(224, 90, 90, 0.14)',
          genuine: '#2FAE7A',
          'genuine-bg': 'rgba(47, 174, 122, 0.14)',
          warning: '#E8A838',
          'warning-bg': 'rgba(232, 168, 56, 0.14)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 12px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.04)',
        'btn': '0 4px 14px -3px rgba(58,120,242,0.35)',
        'btn-hover': '0 6px 20px -3px rgba(58,120,242,0.45)',
      },
      borderRadius: {
        'card': '14px',
        'input': '10px',
      },
    },
  },
  plugins: [],
}
