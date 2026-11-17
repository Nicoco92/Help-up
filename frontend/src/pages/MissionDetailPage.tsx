import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldAlert, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, exploreApi, missionsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { CategoryBadge } from '../components/CategoryBadge'
import { StatusBadge } from '../components/StatusBadge'
import { ApplyPanel } from '../components/ApplyPanel'
import type { Mission } from '../types/mission'

function formatReward(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    value / 100,
  )
}

function BackButton() {
  const navigate = useNavigate()

  return (
    <button className="back-link" type="button" onClick={() => navigate(-1)}>
      <ArrowLeft size={18} aria-hidden="true" />
      Retour
    </button>
  )
}

// Modération : seul un administrateur voit ce bloc. L'API vérifie aussi le rôle (403 sinon) :
// masquer le bouton n'est que de l'ergonomie, pas de la sécurité.
function AdminDeletePanel({ mission }: { mission: Mission }) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await missionsApi.remove(mission.id)
      navigate('/missions', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La mission n’a pas pu être supprimée.')
      setDeleting(false)
    }
  }

  return (
    <section className="admin-panel" aria-label="Modération">
      <div className="admin-panel__text">
        <ShieldAlert size={20} aria-hidden="true" />
        <div>
          <strong>Modération</strong>
          <p>
            {confirming
              ? `Supprimer définitivement « ${mission.title} » et ses candidatures ? Cette action est irréversible.`
              : 'En tant qu’administrateur, tu peux supprimer cette mission.'}
          </p>
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="admin-panel__actions">
        {confirming ? (
          <>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setConfirming(false)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" disabled={deleting} onClick={handleDelete} icon={<Trash2 size={15} />}>
              {deleting ? 'Suppression…' : 'Confirmer la suppression'}
            </Button>
          </>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)} icon={<Trash2 size={15} />}>
            Supprimer la mission
          </Button>
        )}
      </div>
    </section>
  )
}

export function MissionDetailPage() {
  const { isAdmin } = useAuth()
  const { id } = useParams()
  const [mission, setMission] = useState<Mission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    if (!id) return () => controller.abort()
    exploreApi
      .getById(id, controller.signal)
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
      <div className="detail-page">
        <section className="state-card detail-state" role="alert">
          <h1>Mission introuvable</h1>
          <Link className="button button--primary" to="/missions">
            Voir les missions
          </Link>
        </section>
      </div>
    )
  }

  if (loadedId !== id) {
    return (
      <div className="detail-page">
        <div className="detail-skeleton" aria-label="Chargement de la mission" aria-busy="true" />
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div className="detail-page">
        <BackButton />
        <section className="state-card detail-state" role="alert">
          <span className="state-icon">!</span>
          <h1>Mission indisponible</h1>
          <p>{error ?? 'Cette mission ne peut pas être affichée.'}</p>
          <Link className="button button--primary" to="/missions">
            Voir les missions
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <BackButton />
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

        {/* Candidatures (Romain) : l'API n'affiche ici que des missions ouvertes d'autres membres */}
        {!mission.alreadyApplied && mission.status === 'open' && <ApplyPanel missionId={mission.id} />}

        {isAdmin && <AdminDeletePanel mission={mission} />}

      </article>
    </div>
  )
}
