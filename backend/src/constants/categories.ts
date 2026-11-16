// Catégories de mission : mêmes slugs que les icônes Lucide de la charte graphique (§8).
// Toute modification doit être reportée dans backend/sql/seed.js (et son bloc dans migration/seed-demo.js).
export const CATEGORIES = [
  { slug: 'bricolage', label: 'Bricolage', icon: 'hammer' },
  { slug: 'informatique', label: 'Informatique', icon: 'code' },
  { slug: 'soutien-scolaire', label: 'Soutien scolaire', icon: 'book-open' },
  { slug: 'courses', label: 'Courses', icon: 'shopping-basket' },
  { slug: 'demenagement', label: 'Déménagement', icon: 'truck' },
  { slug: 'animaux', label: 'Animaux', icon: 'dog' },
  { slug: 'jardinage', label: 'Jardinage', icon: 'leaf' },
  { slug: 'garde-enfants', label: "Garde d'enfants", icon: 'baby' },
] as const

export type Category = (typeof CATEGORIES)[number]
export type CategorySlug = Category['slug']

// Tuple non vide : utilisable directement dans z.enum(CATEGORY_SLUGS) et dans un enum Mongoose.
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]]
