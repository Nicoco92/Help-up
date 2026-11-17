import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// En-têtes de sécurité du front (docs/securite.md).
// Le JWT est dans le localStorage : la Content-Security-Policy est la défense principale contre le vol
// du jeton par XSS (seuls nos scripts s'exécutent, les données ne partent que vers l'API et les cartes).
function securityHeaders(apiUrl: string, withCsp: boolean): Record<string, string> {
  // « http://localhost:3000/api » → « http://localhost:3000 »
  const apiOrigin = /^https?:\/\/[^/]+/.exec(apiUrl)?.[0] ?? ''
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    // Aucune API sensible du navigateur n'est utilisée par HelpUP
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
  if (withCsp) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self'",
      // React et les cartes posent des attributs style="…" : 'unsafe-inline' limité aux styles
      "style-src 'self' 'unsafe-inline'",
      // Tuiles OpenStreetMap, images de la carte 3D, avatars (URL https choisies par les membres)
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin} https://tiles.openfreemap.org`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  }
  return headers
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Un seul .env pour tout le projet, à la racine. Seules les variables VITE_ sont exposées au navigateur.
  // Sous Docker, VITE_API_URL arrive par l'environnement du conteneur (compose.yaml).
  // loadEnv lit aussi les variables VITE_ de l'environnement du processus (conteneur Docker)
  const env = loadEnv(mode, '..', 'VITE_')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000/api'

  return {
    plugins: [react()],
    envDir: '..',
    // Développement : pas de CSP (le rechargement à chaud de Vite injecte des scripts en ligne)
    server: { headers: securityHeaders(apiUrl, false) },
    // `npm run preview` sert le build de production avec la CSP complète : c'est elle qu'on teste avant
    // un déploiement, et ces mêmes en-têtes sont à recopier dans le serveur web de production.
    preview: { headers: securityHeaders(apiUrl, true) },
  }
})
