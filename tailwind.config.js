/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'casino-green': '#0a5c36',
        'chip-gold': '#ffd700',
        'card-red': '#ff0000',
        'card-black': '#000000'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
