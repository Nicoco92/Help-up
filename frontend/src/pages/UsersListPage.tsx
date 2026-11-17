import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, SearchX, Users } from 'lucide-react'
import { usersApi } from '../services/api'
import type { PublicUser } from '../types/auth'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES } from '../constants/categories'
import { Avatar } from '../components/Avatar'
import { Alert } from '../components/Alert'
import { SkillList } from '../components/Skills'
import { EmptyState } from '../components/States'
import { fullName } from '../utils/format'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function MemberCard({ member, isMe }: { member: PublicUser; isMe: boolean }) {
  return (
    <Link to={`/users/${member.id}`} className="card card--interactive member-card">
      <div className="member-card__head">
        <Avatar {...member} size={48} />
        <div>
          <h3>
            {fullName(member)} {isMe && <span className="badge">Toi</span>}
          </h3>
          <span className="member-card__city">
            <MapPin size={14} aria-hidden="true" />
            {member.city ?? 'Ville non précisée'}
          </span>
        </div>
      </div>
      {member.bio && <p className="member-card__bio">{member.bio}</p>}
      <div className="member-card__foot">
        <SkillList skills={member.skills.slice(0, 4)} />
      </div>
    </Link>
  )
}

function SkeletonGrid() {
  return (
    <div className="member-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 180 }} />
      ))}
    </div>
  )
}

export function UsersListPage() {
  const { user: me } = useAuth()
  const [members, setMembers] = useState<PublicUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState('')

  useEffect(() => {
    let cancelled = false
    usersApi
      .list()
      .then(({ items }) => !cancelled && setMembers(items))
      .catch((err: Error) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  // L'annuaire ne montre que les membres (les comptes admin sont exclus côté API).
  const visible = useMemo(() => {
    if (!members) return []
    const q = normalize(query.trim())
    return members.filter(
      (m) =>
        m.role !== 'admin' &&
        (!skill || m.skills.includes(skill)) &&
        (!q || normalize(`${m.firstName} ${m.lastName} ${m.city ?? ''}`).includes(q)),
    )
  }, [members, query, skill])

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <div>
            <h1>Membres</h1>
            <p>Les voisins prêts à donner un coup de main, et leurs compétences.</p>
          </div>
          {members && (
            <span className="badge badge--neutral">
              {visible.length} membre{visible.length > 1 ? 's' : ''}
            </span>
          )}
        </header>

        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : !members ? (
          <SkeletonGrid />
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="Aucun membre pour l’instant">
            Invite tes voisins à rejoindre HelpUP !
          </EmptyState>
        ) : (
          <>
            <div className="toolbar" role="search">
              <div className="field__control">
                <Search size={18} className="field__icon" aria-hidden="true" />
                <input
                  type="search"
                  className="input input--with-icon"
                  placeholder="Rechercher un nom ou une ville"
                  aria-label="Rechercher un membre par nom ou ville"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="select"
                aria-label="Filtrer par compétence"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
              >
                <option value="">Toutes les compétences</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Aucun membre ne correspond"
                action={
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      setQuery('')
                      setSkill('')
                    }}
                  >
                    Effacer les filtres
                  </button>
                }
              >
                Essaie un autre nom, une autre ville ou une autre compétence.
              </EmptyState>
            ) : (
              <div className="member-grid">
                {visible.map((m) => (
                  <MemberCard key={m.id} member={m} isMe={m.id === me?.id} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
