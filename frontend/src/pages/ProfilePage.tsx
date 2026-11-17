import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { AlignLeft, Calendar, Mail, MapPin, Pencil, Phone, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/Avatar'
import { Alert } from '../components/Alert'
import { TextField, TextAreaField } from '../components/Field'
import { SkillList, SkillPicker } from '../components/Skills'
import { UserReviews } from '../components/UserReviews'
import { Spinner } from '../components/States'
import { formatPhone, fullName, memberSince, profileCompletion } from '../utils/format'
import {
  focusFirstInvalid,
  hasErrors,
  normalizePhone,
  validateName,
  validatePhone,
  type FieldErrors,
} from '../utils/validation'
import type { User } from '../types/auth'

type ProfileField = 'firstName' | 'lastName' | 'phone' | 'city' | 'bio'

function toForm(user: User) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ? formatPhone(user.phone) : '',
    city: user.city ?? '',
    bio: user.bio ?? '',
    skills: user.skills,
  }
}

function ProfileView({ user }: { user: User }) {
  return (
    <div className="card">
      <section className="card__section">
        <h2 className="card__section-title">
          <AlignLeft size={18} aria-hidden="true" /> À propos
        </h2>
        {user.bio ? (
          <p style={{ whiteSpace: 'pre-line' }}>{user.bio}</p>
        ) : (
          <p className="empty-value">Tu n’as pas encore écrit de présentation.</p>
        )}
      </section>

      <section className="card__section">
        <h2 className="card__section-title">
          <Sparkles size={18} aria-hidden="true" /> Compétences
        </h2>
        <SkillList skills={user.skills} empty="Aucune compétence indiquée." />
      </section>

      <UserReviews userId={user.id} empty="Tu n’as pas encore reçu d’avis. Ils apparaîtront ici après tes premières missions." />

      <section className="card__section">
        <h2 className="card__section-title">
          <UserRound size={18} aria-hidden="true" /> Informations personnelles
        </h2>
        <dl className="info-list">
          <div className="info-row">
            <dt>
              <Mail size={16} aria-hidden="true" /> Email
            </dt>
            <dd>{user.email}</dd>
          </div>
          <div className="info-row">
            <dt>
              <Phone size={16} aria-hidden="true" /> Téléphone
            </dt>
            <dd>{user.phone ? formatPhone(user.phone) : <span className="empty-value">Non renseigné</span>}</dd>
          </div>
          <div className="info-row">
            <dt>
              <MapPin size={16} aria-hidden="true" /> Ville
            </dt>
            <dd>{user.city ?? <span className="empty-value">Non renseignée</span>}</dd>
          </div>
        </dl>
        <p className="field__hint" style={{ marginTop: 16 }}>
          Ton email et ton téléphone ne sont jamais affichés aux autres membres.
        </p>
      </section>
    </div>
  )
}

interface ProfileFormProps {
  user: User
  onCancel: () => void
  onSaved: () => void
}

function ProfileForm({ user, onCancel, onSaved }: ProfileFormProps) {
  const { updateProfile } = useAuth()
  const [form, setForm] = useState(() => toForm(user))
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const nextErrors = {
      firstName: validateName(form.firstName, 'prénom'),
      lastName: validateName(form.lastName, 'nom'),
      phone: validatePhone(form.phone),
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return focusFirstInvalid()

    setSaving(true)
    try {
      // Les champs vides sont envoyés en "" : l'API efface alors la valeur.
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: normalizePhone(form.phone),
        city: form.city.trim(),
        bio: form.bio.trim(),
        skills: form.skills,
      })
      onSaved()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div style={{ marginBottom: 24 }}>
          <Alert variant="error">{formError}</Alert>
        </div>
      )}

      <section className="card__section">
        <h2 className="card__section-title">Identité</h2>
        <div className="grid-2">
          <TextField
            label="Prénom"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            error={errors.firstName}
            maxLength={50}
          />
          <TextField
            label="Nom"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            error={errors.lastName}
            maxLength={50}
            hint="Les autres membres ne voient que l’initiale."
          />
        </div>
      </section>

      <section className="card__section">
        <h2 className="card__section-title">Coordonnées</h2>
        <div className="stack">
          <TextField
            label="Adresse email"
            value={user.email}
            icon={Mail}
            disabled
            hint="L’adresse email sert d’identifiant et ne peut pas être modifiée."
          />
          <div className="grid-2">
            <TextField
              label="Téléphone"
              optional
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              icon={Phone}
              placeholder="06 12 34 56 78"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              error={errors.phone}
              hint="Privé : jamais affiché publiquement."
            />
            <TextField
              label="Ville ou quartier"
              optional
              autoComplete="address-level2"
              icon={MapPin}
              placeholder="Paris 13ᵉ"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              error={errors.city}
              maxLength={80}
            />
          </div>
        </div>
      </section>

      <section className="card__section">
        <h2 className="card__section-title">À propos</h2>
        <TextAreaField
          label="Présentation"
          optional
          rows={4}
          maxLength={500}
          placeholder="Étudiante en 2ᵉ année, disponible le week-end pour du soutien scolaire ou garder vos animaux."
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          error={errors.bio}
        />
      </section>

      <section className="card__section">
        <h2 className="card__section-title">Compétences</h2>
        <p className="field__hint" style={{ marginBottom: 12 }}>
          Choisis les types de missions que tu sais faire (8 maximum).
        </p>
        <SkillPicker value={form.skills} onChange={(skills) => set('skills', skills)} />
      </section>

      <div className="card__section form-footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Annuler
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? <Spinner label="Enregistrement" /> : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const location = useLocation()
  const isWelcome = Boolean((location.state as { welcome?: boolean } | null)?.welcome)

  const [editing, setEditing] = useState(isWelcome)
  const [saved, setSaved] = useState(false)

  // RequireAuth garantit qu'on a un utilisateur ici.
  if (!user) return null

  const { percent } = profileCompletion(user)

  return (
    <div className="page page--narrow">
      <div className="container">
        {isWelcome && editing && (
          <div style={{ marginBottom: 24 }}>
            <Alert variant="success">
              <strong>Bienvenue sur HelpUP, {user.firstName} !</strong> Ton compte est créé.
              Prends une minute pour compléter ton profil : les membres font plus facilement
              confiance à un profil renseigné.
            </Alert>
          </div>
        )}
        {saved && !editing && (
          <div style={{ marginBottom: 24 }}>
            <Alert variant="success" onClose={() => setSaved(false)}>
              Profil enregistré.
            </Alert>
          </div>
        )}

        <div className="page-header" style={{ alignItems: 'center' }}>
          <div className="profile-hero">
            <Avatar {...user} size={80} />
            <div className="profile-hero__info">
              <h1>{fullName(user)}</h1>
              <div className="profile-hero__meta">
                {user.city && (
                  <span>
                    <MapPin size={14} aria-hidden="true" /> {user.city}
                  </span>
                )}
                <span>
                  <Calendar size={14} aria-hidden="true" /> Membre depuis{' '}
                  {memberSince(user.createdAt)}
                </span>
                {percent < 100 && <span>Profil complété à {percent} %</span>}
              </div>
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setSaved(false)
                setEditing(true)
              }}
            >
              <Pencil size={16} aria-hidden="true" />
              Modifier mon profil
            </button>
          )}
        </div>

        {editing ? (
          <ProfileForm
            user={user}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false)
              setSaved(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        ) : (
          <ProfileView user={user} />
        )}
      </div>
    </div>
  )
}
