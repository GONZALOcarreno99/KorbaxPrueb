/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['"Nunito Sans"', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        carbon: '#161010',   /* negro oscuro — fondo principal    */
        petrol: '#1E2E30',   /* azul petróleo — nav / secciones  */
        stone:  '#77706C',   /* gris medio — texto secundario     */
        mist:   '#B6B5B4',   /* gris claro — texto terciario      */
        ivory:  '#FBFBFB',   /* blanco — fondos claros / cards    */
        sand: {              /* naranja beige — acento / CTA      */
          300: '#f9d0aa',
          400: '#F1AF78',
          500: '#e8984f',
          600: '#d4803a',
        },
      },
    },
  },
  plugins: [],
}
