import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { CategoryBadge } from '../components/CategoryBadge'
import { StatusBadge } from '../components/StatusBadge'
import type { Mission } from '../types/mission'

function formatReward(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    value / 100,
  )
}

export function MissionDetailPage() {
  const { id } = useParams()
  const [mission, setMission] = useState<Mission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    if (!id) return () => controller.abort()
    api<Mission>(`/explore/missions/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((result) => {
        setMission(result)
        setError(null)
        setLoadedId(id)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(
          cause instanceof ApiError && cause.status === 404
            ? 'Cette mission n’est plus disponible.'
            : cause instanceof Error
              ? cause.message
              : 'La mission ne peut pas être chargée pour le moment.',
        )
        setLoadedId(id)
      })

    return () => controller.abort()
  }, [id])

  if (!id) {
    return (
      <main className="detail-page">
        <section className="state-card detail-state" role="alert">
          <h1>Mission introuvable</h1>
          <Link className="button button--primary" to="/">
            Voir les missions
          </Link>
        </section>
      </main>
    )
  }

  if (loadedId !== id) {
    return (
      <main className="detail-page">
        <div className="detail-skeleton" aria-label="Chargement de la mission" aria-busy="true" />
      </main>
    )
  }

  if (error || !mission) {
    return (
      <main className="detail-page">
        <Link className="back-link" to="/">
          <ArrowLeft size={18} aria-hidden="true" />
          Retour aux missions
        </Link>
        <section className="state-card detail-state" role="alert">
          <span className="state-icon">!</span>
          <h1>Mission indisponible</h1>
          <p>{error ?? 'Cette mission ne peut pas être affichée.'}</p>
          <Link className="button button--primary" to="/">
            Voir les missions
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="detail-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={18} aria-hidden="true" />
        Retour aux missions
      </Link>
      <article className="detail-card">
        <div className="detail-header">
          <div>
            <CategoryBadge category={mission.category} label={mission.categoryLabel} />
            <h1>{mission.title}</h1>
            <div className="detail-badges">
              <StatusBadge status={mission.status} />
              {mission.urgent && <span className="urgent-badge">Besoin urgent</span>}
            </div>
          </div>
          <span className="detail-price">{formatReward(mission.rewardCents)}</span>
        </div>

        <div className="detail-facts">
          <span>
            <MapPin size={18} aria-hidden="true" />
            {mission.quartierLabel}
          </span>
          <span>
            <CalendarDays size={18} aria-hidden="true" />
            {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date(mission.scheduledAt))}
          </span>
          <span>
            <Clock3 size={18} aria-hidden="true" />
            {mission.estimatedMinutes} minutes estimées
          </span>
        </div>

        <section className="detail-section">
          <h2>À propos de la mission</h2>
          <p className="detail-description">{mission.description}</p>
        </section>

        <section className="owner-panel">
          <span className="owner-avatar owner-avatar-large" aria-hidden="true">
            {mission.owner?.firstName.charAt(0).toUpperCase() ?? '?'}
          </span>
          <div>
            <p className="eyebrow">Proposée par</p>
            <strong>{mission.owner?.firstName ?? 'Membre HelpUP'}</strong>
            {mission.owner?.city && <span>{mission.owner.city}</span>}
          </div>
        </section>

        {mission.alreadyApplied && (
          <p className="already-applied" role="status">
            <CheckCircle2 size={19} aria-hidden="true" />
            Vous avez déjà envoyé une candidature pour cette mission.
          </p>
        )}

      </article>
    </main>
  )
}
