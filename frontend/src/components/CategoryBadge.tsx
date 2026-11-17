import {
  Baby,
  BookOpen,
  CodeXml,
  Dog,
  Hammer,
  Leaf,
  ShoppingBasket,
  Tag,
  Truck,
  type LucideIcon,
} from 'lucide-react'

const categoryIcons: Record<string, LucideIcon> = {
  bricolage: Hammer,
  informatique: CodeXml,
  'soutien-scolaire': BookOpen,
  courses: ShoppingBasket,
  demenagement: Truck,
  animaux: Dog,
  jardinage: Leaf,
  'garde-enfants': Baby,
}

export function CategoryBadge({ category, label }: { category: string; label: string }) {
  const Icon = categoryIcons[category] ?? Tag

  return (
    <span className="category-label">
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
