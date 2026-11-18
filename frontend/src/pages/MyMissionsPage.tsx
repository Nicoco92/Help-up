import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, ClipboardList, Clock3, Eye, EyeOff, MapPin, Pencil, Plus } from 'lucide-react'
import { missionsApi } from '../services/api'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { CategoryBadge } from '../components/CategoryBadge'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState, PageLoader } from '../components/States'
import { getCategory } from '../constants/categories'
import { quartierLabel } from '../constants/quartiers'
import type { MissionStatus, MyMission } from '../types/mission'

// « Mes missions » : missions publiées par le membre connecté (GET /api/missions, cloisonné par le JWT).
// Le membre peut modifier une mission ouverte et la masquer / réafficher ; il ne peut pas la supprimer.

type Filter = 'all' | MissionStatus

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'assigned', label: 'Attribuées' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
]

const formatReward = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(cents / 100)

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

const formatDuration = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60}` : ''}` : `${minutes} min`

function MyMissionItem({
  mission,
  busy,
  onToggleHidden,
}: {
  mission: MyMission
  busy: boolean
  onToggleHidden: (mission: MyMission) => void
}) {
  const isOpen = mission.status === 'open'
  return (
    <article className={`my-mission${mission.hidden ? ' is-hidden' : ''}`}>
      <div className="my-mission__main">
        <div className="my-mission__badges">
          <CategoryBadge category={mission.category} label={getCategory(mission.category)?.label ?? mission.category} />
          <StatusBadge status={mission.status} />
          {mission.urgent && <span className="urgent-badge">Besoin urgent</span>}
          {mission.hidden && (
            <span className="hidden-badge">
              <EyeOff size={16} aria-hidden="true" />
              Masquée
            </span>
          )}
        </div>
        <h2>{mission.title}</h2>
        <p className="my-mission__description">{mission.description}</p>
        <div className="mission-meta">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {quartierLabel(mission.quartier)}
          </span>
          <span>
            <CalendarDays size={16} aria-hidden="true" />
            {formatDate(mission.scheduledAt)}
          </span>
          <span>
            <Clock3 size={16} aria-hidden="true" />
            {formatDuration(mission.estimatedMinutes)}
          </span>
        </div>
      </div>
      <div className="my-mission__side">
        <span className="price-pill">{formatReward(mission.rewardCents)}</span>
        {isOpen ? (
          <div className="my-mission__actions">
            <Link className="button button--secondary button--sm" to={`/missions/${mission.id}/edit`}>
              <span className="button__icon">
                <Pencil size={16} aria-hidden="true" />
              </span>
              <span className="button__label">Modifier</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onToggleHidden(mission)}
              icon={mission.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
            >
              {mission.hidden ? 'Réafficher' : 'Masquer'}
            </Button>
          </div>
        ) : (
          <small className="my-mission__locked">Plus modifiable</small>
        )}
      </div>
    </article>
  )
}

export function MyMissionsPage() {
  const location = useLocation()
  const [flash, setFlash] = useState<string | null>(
    () => (location.state as { flash?: string } | null)?.flash ?? null,
  )
  const [missions, setMissions] = useState<MyMission[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    missionsApi
      .listMine(undefined, controller.signal)
      .then((res) => setMissions(res.items))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause.message : 'Tes missions ne peuvent pas être chargées.')
        setMissions([])
      })
    return () => controller.abort()
  }, [])

  const toggleHidden = async (mission: MyMission) => {
    setBusyId(mission.id)
    setError(null)
    try {
      const updated = await missionsApi.setHidden(mission.id, !mission.hidden)
      setMissions((list) => list?.map((m) => (m.id === updated.id ? updated : m)) ?? null)
      setFlash(
        updated.hidden
          ? 'Mission masquée : elle n’apparaît plus dans le catalogue.'
          : 'Mission réaffichée dans le catalogue.',
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La mission n’a pas pu être modifiée.')
    } finally {
      setBusyId(null)
    }
  }

  if (missions === null) return <PageLoader />

  const count = (f: Filter) => (f === 'all' ? missions.length : missions.filter((m) => m.status === f).length)
  const visible = filter === 'all' ? missions : missions.filter((m) => m.status === filter)

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Mes missions</h1>
            <p>Les coups de main que tu as demandés à tes voisins.</p>
          </div>
          <Link className="button button--primary button--md" to="/missions/new">
            <span className="button__icon">
              <Plus size={18} aria-hidden="true" />
            </span>
            <span className="button__label">Publier une mission</span>
          </Link>
        </div>

        <div className="stack">
          {flash && (
            <Alert variant="success" onClose={() => setFlash(null)}>
              {flash}
            </Alert>
          )}
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {missions.length > 0 && (
            <div className="my-missions__filters" role="group" aria-label="Filtrer par statut">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className="chip"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label} <span className="my-missions__count">{count(f.value)}</span>
                </button>
              ))}
            </div>
          )}

          {missions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Tu n’as encore publié aucune mission"
              action={
                <Link className="button button--primary button--md" to="/missions/new">
                  Publier ma première mission
                </Link>
              }
            >
              Besoin d’un coup de main pour le jardin, un déménagement ou des courses ? Publie une mission en
              deux minutes.
            </EmptyState>
          ) : visible.length === 0 ? (
            <p className="empty-value">Aucune mission avec ce statut.</p>
          ) : (
            <div className="my-missions__list">
              {visible.map((m) => (
                <MyMissionItem key={m.id} mission={m} busy={busyId === m.id} onToggleHidden={toggleHidden} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
