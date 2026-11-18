import { Tag } from 'lucide-react'
import { getCategory } from '../constants/categories'

export function CategoryBadge({ category, label }: { category: string; label: string }) {
  const Icon = getCategory(category)?.icon ?? Tag

  return (
    <span className="category-label">
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
