import { CATEGORIES, getCategory } from '../constants/categories'

const MAX_SKILLS = 8

interface SkillPickerProps {
  value: string[]
  onChange: (skills: string[]) => void
}

// Sélection multiple des compétences : chaque puce est un bouton à bascule (aria-pressed).
export function SkillPicker({ value, onChange }: SkillPickerProps) {
  const toggle = (slug: string) =>
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug])

  return (
    <div className="chips" role="group" aria-label="Compétences">
      {CATEGORIES.map(({ slug, label, icon: Icon }) => {
        const selected = value.includes(slug)
        return (
          <button
            key={slug}
            type="button"
            className="chip"
            aria-pressed={selected}
            disabled={!selected && value.length >= MAX_SKILLS}
            onClick={() => toggle(slug)}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function SkillList({ skills, empty }: { skills: string[]; empty?: string }) {
  if (skills.length === 0) {
    return empty ? <span className="empty-value">{empty}</span> : null
  }
  return (
    <ul className="chips" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {skills.map((slug) => {
        const category = getCategory(slug)
        const Icon = category?.icon
        return (
          <li key={slug} className="chip chip--static">
            {Icon && <Icon size={14} aria-hidden="true" />}
            {category?.label ?? slug}
          </li>
        )
      })}
    </ul>
  )
}
