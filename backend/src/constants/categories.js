// Catégories de mission : mêmes slugs que les icônes Lucide de la charte graphique (§8).
const CATEGORIES = [
  { slug: 'bricolage', label: 'Bricolage', icon: 'hammer' },
  { slug: 'informatique', label: 'Informatique', icon: 'code' },
  { slug: 'soutien-scolaire', label: 'Soutien scolaire', icon: 'book-open' },
  { slug: 'courses', label: 'Courses', icon: 'shopping-basket' },
  { slug: 'demenagement', label: 'Déménagement', icon: 'truck' },
  { slug: 'animaux', label: 'Animaux', icon: 'dog' },
  { slug: 'jardinage', label: 'Jardinage', icon: 'leaf' },
  { slug: 'garde-enfants', label: "Garde d'enfants", icon: 'baby' },
]

const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug)

module.exports = { CATEGORIES, CATEGORY_SLUGS }
