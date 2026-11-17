import {
  Baby,
  BookOpen,
  Code,
  Dog,
  Hammer,
  Leaf,
  ShoppingBasket,
  Truck,
  type LucideIcon,
} from 'lucide-react'

// Mêmes slugs que backend/src/constants/categories.ts ; icônes de la charte graphique (§8).
export const CATEGORIES: ReadonlyArray<{ slug: string; label: string; icon: LucideIcon }> = [
  { slug: 'bricolage', label: 'Bricolage', icon: Hammer },
  { slug: 'informatique', label: 'Informatique', icon: Code },
  { slug: 'soutien-scolaire', label: 'Soutien scolaire', icon: BookOpen },
  { slug: 'courses', label: 'Courses', icon: ShoppingBasket },
  { slug: 'demenagement', label: 'Déménagement', icon: Truck },
  { slug: 'animaux', label: 'Animaux', icon: Dog },
  { slug: 'jardinage', label: 'Jardinage', icon: Leaf },
  { slug: 'garde-enfants', label: "Garde d'enfants", icon: Baby },
]

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)
}
