/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matte-black': '#0a0a0a',
        'dark-gray': '#1a1a1a',
        'bronze': {
          400: '#d4af37',
          500: '#cd7f32',
          600: '#b8860b',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
