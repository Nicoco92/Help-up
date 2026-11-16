import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Un seul .env pour tout le projet, à la racine. Seules les variables VITE_ sont exposées au navigateur.
  // Sous Docker, VITE_API_URL arrive par l'environnement du conteneur (compose.yaml).
  envDir: '..',
})
