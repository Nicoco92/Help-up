// Informations des pages légales (mentions légales, confidentialité, conditions d'utilisation),
// réunies ici pour être tenues à jour en un seul endroit.

export const LEGAL_UPDATED_AT = '18 novembre 2026'

export const EDITORS = ['Romain Poisson', 'Nicolas Contreras', 'Yaël Coëffier'] as const
export const PUBLICATION_DIRECTOR = 'Romain Poisson'

export const HOST = {
  name: 'OVH SAS',
  address: '2 rue Kellermann, 59100 Roubaix, France',
  phone: '1007',
  website: 'https://www.ovhcloud.com/fr/',
  serverLocation: 'Londres, au Royaume-Uni',
} as const

// Base de données de production : MongoDB Atlas.
// `location` : région du cluster, visible dans Atlas (Database > Clusters). Laissée vide, la phrase n'est pas affichée.
export const DATABASE = {
  provider: 'MongoDB, Inc.',
  service: 'MongoDB Atlas',
  location: 'sur des serveurs d’Amazon Web Services situés à Paris, en France',
} as const

// Journaux des conteneurs : rotation configurée dans compose.yaml (x-logging), à garder synchronisée
export const LOG_RETENTION = '30 Mo par service'

export const LEGAL_PAGES = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/conditions', label: 'Conditions d’utilisation' },
] as const

export const EXTERNAL = {
  cnil: 'https://www.cnil.fr/fr/plaintes',
  cloudflarePrivacy: 'https://www.cloudflare.com/fr-fr/privacypolicy/',
  mongodbPrivacy: 'https://www.mongodb.com/legal/privacy/privacy-policy',
  osmPrivacy: 'https://osmfoundation.org/wiki/Privacy_Policy',
  openFreeMap: 'https://openfreemap.org/',
} as const
