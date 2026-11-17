import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AlignLeft, ArrowLeft, Calendar, Mail, MapPin, Phone, Sparkles, UserX } from 'lucide-react'
import { usersApi, ApiError } from '../services/api'
import type { PublicUser } from '../types/auth'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/Avatar'
import { Alert } from '../components/Alert'
import { SkillList } from '../components/Skills'
import { UserReviews } from '../components/UserReviews'
import { EmptyState, PageLoader } from '../components/States'
import { formatPhone, fullName, memberSince } from '../utils/format'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; profile: PublicUser }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

export function UserProfilePage() {
  const { id = '' } = useParams<{ id: string }>()
  const { user: me, isAdmin } = useAuth()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  // Réinitialise l'état quand on passe d'un profil à un autre.
  const [lastId, setLastId] = useState(id)
  if (lastId !== id) {
    setLastId(id)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    if (id === me?.id) return
    let cancelled = false
    usersApi
      .getById(id)
      .then((profile) => !cancelled && setState({ status: 'ready', profile }))
      .catch((err) => {
        if (cancelled) return
        // 400 (id mal formé) et 404 (absent) : même écran pour l'utilisateur.
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setState({ status: 'not-found' })
        } else {
          setState({ status: 'error', message: (err as Error).message })
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, me?.id])

  // Son propre profil se consulte (et se modifie) depuis /profile.
  if (id === me?.id) return <Navigate to="/profile" replace />

  const back = (
    <Link to="/users" className="btn btn--ghost" style={{ marginLeft: -12, marginBottom: 16 }}>
      <ArrowLeft size={18} aria-hidden="true" />
      Tous les membres
    </Link>
  )

  if (state.status === 'loading') return <PageLoader />

  if (state.status === 'not-found') {
    return (
      <div className="page">
        <EmptyState
          icon={UserX}
          title="Profil introuvable"
          action={
            <Link to="/users" className="btn btn--secondary">
              Voir les membres
            </Link>
          }
        >
          Ce membre n’existe pas ou a supprimé son compte.
        </EmptyState>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="page page--narrow">
        <div className="container">
          {back}
          <Alert variant="error">{state.message}</Alert>
        </div>
      </div>
    )
  }

  const { profile } = state

  return (
    <div className="page page--narrow">
      <div className="container">
        {back}

        <div className="page-header">
          <div className="profile-hero">
            <Avatar {...profile} size={80} />
            <div className="profile-hero__info">
              <h1>{fullName(profile)}</h1>
              <div className="profile-hero__meta">
                {profile.city && (
                  <span>
                    <MapPin size={14} aria-hidden="true" /> {profile.city}
                  </span>
                )}
                <span>
                  <Calendar size={14} aria-hidden="true" /> Membre depuis{' '}
                  {memberSince(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <section className="card__section">
            <h2 className="card__section-title">
              <AlignLeft size={18} aria-hidden="true" /> À propos
            </h2>
            {profile.bio ? (
              <p style={{ whiteSpace: 'pre-line' }}>{profile.bio}</p>
            ) : (
              <p className="empty-value">{profile.firstName} n’a pas encore écrit de présentation.</p>
            )}
          </section>

          <section className="card__section">
            <h2 className="card__section-title">
              <Sparkles size={18} aria-hidden="true" /> Compétences
            </h2>
            <SkillList skills={profile.skills} empty="Aucune compétence indiquée." />
          </section>

          <UserReviews userId={profile.id} empty={`${profile.firstName} n’a pas encore reçu d’avis.`} />

          {/* Coordonnées : renvoyées par l'API uniquement à un administrateur. */}
          {isAdmin && (profile.email || profile.phone) && (
            <section className="card__section">
              <h2 className="card__section-title">
                Coordonnées <span className="badge badge--neutral">Visible par les admins</span>
              </h2>
              <dl className="info-list">
                {profile.email && (
                  <div className="info-row">
                    <dt>
                      <Mail size={16} aria-hidden="true" /> Email
                    </dt>
                    <dd>{profile.email}</dd>
                  </div>
                )}
                {profile.phone && (
                  <div className="info-row">
                    <dt>
                      <Phone size={16} aria-hidden="true" /> Téléphone
                    </dt>
                    <dd>{formatPhone(profile.phone)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
