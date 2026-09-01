/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        segula: {
          blue: '#004B87',    // Bleu corporate principal
          dark: '#002855',    // Bleu nuit (idéal pour la sidebar ou le header)
          cyan: '#00A4E4',    // Bleu clair (accents, boutons, liens)
          gray: '#F3F5F7',    // Gris très clair pour le fond de la zone de chat
          text: '#333333',    // Couleur de texte standard
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Police moderne et lisible
      }
    },
  },
  plugins: [],
}