/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Toggle themes with .dark class on <html>
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in-120': { '0%': { opacity: 0, transform: 'scale(.98)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        pop:           { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'underline-grow': { '0%': { width: '0%' }, '100%': { width: '80%' } },
        shimmer: { '100%': { transform: 'translateX(120%)' } },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-slow-reverse': 'spin 3s linear infinite reverse',
        'spin-medium': 'spin 2s linear infinite',
        'fade-in-120': 'fade-in-120 120ms ease-out both',
        pop: 'pop 160ms ease-out both',
        'underline-grow': 'underline-grow .25s ease-out forwards',
        shimmer: 'shimmer .9s linear',
      },
      boxShadow: {
        'elev-1': '0 2px 12px rgba(0,0,0,.12)',
        'elev-2': '0 10px 30px rgba(0,0,0,.25)',
      },
    },
  },
  plugins: [],
};
