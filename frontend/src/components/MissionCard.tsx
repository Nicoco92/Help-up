import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Mission } from '../types/mission'
import { CategoryBadge } from './CategoryBadge'
import { StatusBadge } from './StatusBadge'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function formatReward(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    value / 100,
  )
}

export function MissionCard({
  mission,
  highlighted,
  onHover,
}: {
  mission: Mission
  highlighted: boolean
  onHover: (id: string | null) => void
}) {
  return (
    <article
      className={`mission-card${highlighted ? ' is-highlighted' : ''}`}
      onMouseEnter={() => onHover(mission.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link className="mission-card-link" to={`/missions/${mission.id}`}>
        <div className="mission-card-topline">
          <CategoryBadge category={mission.category} label={mission.categoryLabel} />
          <div className="mission-card-badges">
            <StatusBadge status={mission.status} />
            {mission.urgent && <span className="urgent-badge">Besoin urgent</span>}
          </div>
        </div>
        <h2>{mission.title}</h2>
        <p className="mission-description">{mission.description}</p>
        <div className="mission-meta">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {mission.quartierLabel}
          </span>
          <span>
            <CalendarDays size={16} aria-hidden="true" />
            {formatDate(mission.scheduledAt)}
          </span>
          <span>
            <Clock3 size={16} aria-hidden="true" />
            {mission.estimatedMinutes >= 60
              ? `${Math.floor(mission.estimatedMinutes / 60)} h${mission.estimatedMinutes % 60 ? ` ${mission.estimatedMinutes % 60} min` : ''}`
              : `${mission.estimatedMinutes} min`}
          </span>
        </div>
        <div className="mission-card-footer">
          <span className="mission-owner">
            <span className="owner-avatar" aria-hidden="true">
              {mission.owner?.firstName.charAt(0).toUpperCase() ?? '?'}
            </span>
            <span>
              <strong>{mission.owner?.firstName ?? 'Membre HelpUP'}</strong>
              {mission.owner?.city && <small>{mission.owner.city}</small>}
            </span>
          </span>
          <span className="price-pill">{formatReward(mission.rewardCents)}</span>
        </div>
      </Link>
    </article>
  )
}
