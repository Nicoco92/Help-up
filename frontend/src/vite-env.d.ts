/// <reference types="vite/client" />

// Variables d'environnement exposées au navigateur (préfixe VITE_, fichier d'env racine).
// Jamais de secret ici : tout ce qui est listé finit dans le JavaScript envoyé au client.
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
