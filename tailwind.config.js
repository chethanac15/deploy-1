/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4fe',
          100: '#dde7fd',
          200: '#c2d4fb',
          300: '#99baf8',
          400: '#6797f3',
          500: '#3b71ec',
          600: '#2554e0',
          700: '#1d41ca',
          800: '#1d36a4',
          900: '#0F172A',
          950: '#080E1E'
        },
        navy: {
          800: '#111827',
          850: '#0f172a',
          900: '#0a0f1d',
          950: '#060913'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(15, 23, 42, 0.09), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
        'modal': '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
      }
    },
  },
  plugins: [],
}
