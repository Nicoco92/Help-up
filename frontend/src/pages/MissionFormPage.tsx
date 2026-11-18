import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ChevronDown, Save, Send } from 'lucide-react'
import { ApiError, missionsApi } from '../services/api'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { BackLink } from '../components/BackLink'
import { TextAreaField, TextField } from '../components/Field'
import { PageLoader } from '../components/States'
import { CATEGORIES } from '../constants/categories'
import { QUARTIERS } from '../constants/quartiers'
import { focusFirstInvalid, hasErrors, type FieldErrors } from '../utils/validation'
import type { MissionPayload, MissionUpdatePayload, MyMission } from '../types/mission'

// Formulaire de création (/missions/new) et de modification (/missions/:id/edit).
// La validation ici ne fait que guider : l'API revalide tout avec zod et renvoie 400 sinon.

type FormValues = {
  title: string
  description: string
  rewardEuros: string
  estimatedMinutes: string
  category: string
  quartier: string
  scheduledAt: string // valeur d'un <input type="datetime-local"> (heure locale)
  urgent: boolean
}
type FormField = Exclude<keyof FormValues, 'urgent'>

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480]

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  return minutes % 60 ? `${h} h ${minutes % 60}` : `${h} h`
}

// Date ISO (UTC) → "2026-12-05T11:00" en heure locale, pour l'input datetime-local.
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyValues: FormValues = {
  title: '',
  description: '',
  rewardEuros: '',
  estimatedMinutes: '60',
  category: '',
  quartier: '',
  scheduledAt: '',
  urgent: false,
}

function fromMission(m: MyMission): FormValues {
  return {
    title: m.title,
    description: m.description,
    rewardEuros: String(m.rewardCents / 100),
    estimatedMinutes: String(m.estimatedMinutes),
    category: m.category,
    quartier: m.quartier,
    scheduledAt: toLocalInput(m.scheduledAt),
    urgent: m.urgent,
  }
}

function validate(v: FormValues): FieldErrors<FormField> {
  const reward = Number(v.rewardEuros.replace(',', '.'))
  const date = new Date(v.scheduledAt)
  return {
    title:
      v.title.trim().length < 5
        ? 'Le titre doit contenir au moins 5 caractères.'
        : v.title.trim().length > 80
          ? 'Le titre ne doit pas dépasser 80 caractères.'
          : undefined,
    description:
      v.description.trim().length < 10
        ? 'Décris la mission en au moins 10 caractères.'
        : undefined,
    rewardEuros:
      !v.rewardEuros || Number.isNaN(reward)
        ? 'Indique une rémunération.'
        : reward < 5 || reward > 500
          ? 'La rémunération doit être comprise entre 5 € et 500 €.'
          : undefined,
    category: v.category ? undefined : 'Choisis une catégorie.',
    quartier: v.quartier ? undefined : 'Choisis un quartier.',
    scheduledAt: !v.scheduledAt
      ? 'Indique la date de la mission.'
      : date.getTime() <= Date.now()
        ? 'La date doit être dans le futur.'
        : undefined,
  }
}

function toPayload(v: FormValues): MissionPayload {
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    rewardCents: Math.round(Number(v.rewardEuros.replace(',', '.')) * 100),
    estimatedMinutes: Number(v.estimatedMinutes),
    category: v.category,
    quartier: v.quartier,
    scheduledAt: new Date(v.scheduledAt).toISOString(),
    urgent: v.urgent,
  }
}

// PATCH partiel : on n'envoie que ce qui a changé (une date passée non modifiée serait refusée).
function changedFields(initial: FormValues, current: FormValues): MissionUpdatePayload {
  const before = toPayload(initial)
  const after = toPayload(current)
  const diff: MissionUpdatePayload = {}
  for (const key of Object.keys(after) as Array<keyof MissionPayload>) {
    if (key === 'scheduledAt' ? initial.scheduledAt !== current.scheduledAt : before[key] !== after[key]) {
      Object.assign(diff, { [key]: after[key] })
    }
  }
  return diff
}

function SelectField({
  label,
  value,
  onChange,
  error,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
      </label>
      <span className="select-field">
        <select
          id={id}
          className="select mission-form__select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          {children}
        </select>
        <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
      </span>
      {error && (
        <p className="field__error" id={`${id}-error`}>
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

function MissionForm({ mission }: { mission: MyMission | null }) {
  const navigate = useNavigate()
  const isEdit = mission !== null
  const [initial] = useState(() => (mission ? fromMission(mission) : emptyValues))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors<FormField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return focusFirstInvalid()

    setSaving(true)
    try {
      if (mission) {
        const diff = changedFields(initial, values)
        if (Object.keys(diff).length > 0) await missionsApi.update(mission.id, diff)
        navigate('/missions/mine', { state: { flash: 'Ta mission a été modifiée.' } })
      } else {
        await missionsApi.create(toPayload(values))
        navigate('/missions/mine', { state: { flash: 'Ta mission est publiée : tes voisins peuvent la voir.' } })
      }
    } catch (cause) {
      // Message de l'API (zod, 409…) : déjà rédigé en français pour l'utilisateur.
      setFormError(cause instanceof Error ? cause.message : 'La mission n’a pas pu être enregistrée.')
      setSaving(false)
    }
  }

  return (
    <form className="card mission-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="card__section">
          <Alert variant="error" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        </div>
      )}

      <section className="card__section">
        <h2 className="card__section-title">La mission</h2>
        <div className="stack">
          <TextField
            label="Titre"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={80}
            placeholder="Ex. Tondre la pelouse"
            error={errors.title}
            required
          />
          <TextAreaField
            label="Description"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="Ce qu’il faut faire, le matériel fourni, les contraintes…"
            error={errors.description}
            required
          />
          <SelectField
            label="Catégorie"
            value={values.category}
            onChange={(v) => set('category', v)}
            error={errors.category}
          >
            <option value="">Choisir une catégorie</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      <section className="card__section">
        <h2 className="card__section-title">Où, quand, combien</h2>
        <div className="stack">
          <div className="grid-2">
            <SelectField
              label="Quartier"
              value={values.quartier}
              onChange={(v) => set('quartier', v)}
              error={errors.quartier}
            >
              <option value="">Choisir un quartier</option>
              {QUARTIERS.map((q) => (
                <option key={q.slug} value={q.slug}>
                  {q.label}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Date et heure"
              type="datetime-local"
              value={values.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)}
              error={errors.scheduledAt}
              required
            />
          </div>
          <div className="grid-2">
            <TextField
              label="Rémunération (€)"
              type="number"
              inputMode="decimal"
              min={5}
              max={500}
              step={0.5}
              value={values.rewardEuros}
              onChange={(e) => set('rewardEuros', e.target.value)}
              hint="Entre 5 € et 500 €."
              error={errors.rewardEuros}
              required
            />
            <SelectField
              label="Durée estimée"
              value={values.estimatedMinutes}
              onChange={(v) => set('estimatedMinutes', v)}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </SelectField>
          </div>
          <label className="mission-form__checkbox">
            <input
              type="checkbox"
              checked={values.urgent}
              onChange={(e) => set('urgent', e.target.checked)}
            />
            <span>
              <strong>Besoin urgent</strong>
              <small>La mission sera signalée comme urgente dans le catalogue.</small>
            </span>
          </label>
        </div>
      </section>

      <div className="card__section form-footer">
        <Link className="button button--ghost button--md" to="/missions/mine">
          Annuler
        </Link>
        <Button type="submit" disabled={saving} icon={isEdit ? <Save size={16} /> : <Send size={16} />}>
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Publier la mission'}
        </Button>
      </div>
    </form>
  )
}

export function MissionFormPage() {
  const { id } = useParams()
  const [mission, setMission] = useState<MyMission | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    missionsApi
      .get(id, controller.signal)
      .then((m) => {
        setMission(m)
        setLoadError(null)
        setLoadedId(id)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setLoadError(
          cause instanceof ApiError && cause.status === 404
            ? 'Cette mission n’existe pas ou ne t’appartient pas.'
            : cause instanceof Error
              ? cause.message
              : 'La mission ne peut pas être chargée.',
        )
        setLoadedId(id)
      })
    return () => controller.abort()
  }, [id])

  const isEdit = Boolean(id)
  if (isEdit && loadedId !== id) return <PageLoader />

  let content: ReactNode
  if (loadError) {
    content = <Alert variant="error">{loadError}</Alert>
  } else if (mission && mission.status !== 'open') {
    content = (
      <Alert variant="info">
        Cette mission n’est plus ouverte : elle ne peut plus être modifiée.
      </Alert>
    )
  } else {
    content = <MissionForm key={mission?.id ?? 'new'} mission={mission} />
  }

  return (
    <div className="page page--form">
      <div className="container">
        <BackLink to="/missions/mine">
          Mes missions
        </BackLink>
        <div className="page-header">
          <div>
            <h1>{isEdit ? 'Modifier la mission' : 'Publier une mission'}</h1>
            <p>
              {isEdit
                ? 'Tu peux modifier ta mission tant qu’elle est ouverte.'
                : 'Décris le coup de main dont tu as besoin : les voisins disponibles pourront postuler.'}
            </p>
          </div>
        </div>
        {content}
      </div>
    </div>
  )
}
