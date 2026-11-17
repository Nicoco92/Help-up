import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, ShieldOff, ShieldPlus } from 'lucide-react'
import { usersApi } from '../services/api'
import type { PublicUser, UserRole } from '../types/auth'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/Avatar'
import { Alert } from '../components/Alert'
import { Spinner } from '../components/States'
import { fullName } from '../utils/format'

// Page réservée aux admins (RequireAdmin). Le serveur revérifie le rôle à chaque appel :
// un non-admin qui appellerait l'API directement recevrait un 403.
export function AdminPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<PublicUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<{ id: string; role: UserRole } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { items } = await usersApi.list()
      setUsers(items)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    usersApi
      .list()
      .then(({ items }) => !cancelled && setUsers(items))
      .catch((err: Error) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  const confirmRoleChange = async () => {
    if (!pending) return
    const target = users?.find((u) => u.id === pending.id)
    setBusyId(pending.id)
    setError(null)
    setNotice(null)
    try {
      await usersApi.updateRole(pending.id, pending.role)
      setNotice(
        `${target ? fullName(target) : 'Ce compte'} est maintenant ${
          pending.role === 'admin' ? 'administrateur' : 'membre'
        }.`,
      )
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
      setPending(null)
    }
  }

  const admins = users?.filter((u) => u.role === 'admin').length ?? 0

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <div>
            <span className="eyebrow">
              <Shield size={16} aria-hidden="true" /> Administration
            </span>
            <h1 style={{ marginTop: 8 }}>Gestion des comptes</h1>
            <p>Consulte les inscrits et gère les droits d’administration.</p>
          </div>
        </header>

        <div className="stack" style={{ marginBottom: 24 }}>
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {notice && (
            <Alert variant="success" onClose={() => setNotice(null)}>
              {notice}
            </Alert>
          )}
        </div>

        {!users ? (
          !error && <div className="skeleton" style={{ height: 320 }} aria-hidden="true" />
        ) : (
          <>
            <div className="stats">
              <div className="card">
                <div className="stat__label">Comptes inscrits</div>
                <div className="stat__value">{users.length}</div>
              </div>
              <div className="card">
                <div className="stat__label">Membres</div>
                <div className="stat__value">{users.length - admins}</div>
              </div>
              <div className="card">
                <div className="stat__label">Administrateurs</div>
                <div className="stat__value">{admins}</div>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Compte</th>
                    <th scope="col">Ville</th>
                    <th scope="col">Inscription</th>
                    <th scope="col">Rôle</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = u.id === me?.id
                    const nextRole: UserRole = u.role === 'admin' ? 'client' : 'admin'
                    const isPending = pending?.id === u.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="table__user">
                            <Avatar {...u} size={36} />
                            <div>
                              {isMe ? (
                                <strong>{fullName(u)}</strong>
                              ) : (
                                <Link to={`/users/${u.id}`}>
                                  <strong>{fullName(u)}</strong>
                                </Link>
                              )}
                              {isMe && <span className="badge" style={{ marginLeft: 8 }}>Toi</span>}
                              <small>{u.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{u.city ?? <span className="muted">—</span>}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {u.role === 'admin' ? (
                            <span className="badge">
                              <Shield size={12} aria-hidden="true" /> Admin
                            </span>
                          ) : (
                            <span className="badge badge--neutral">Membre</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isMe ? null : busyId === u.id ? (
                            <Spinner label="Mise à jour" />
                          ) : isPending ? (
                            <span style={{ display: 'inline-flex', gap: 8 }}>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => setPending(null)}
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                style={{ minHeight: 36 }}
                                onClick={confirmRoleChange}
                              >
                                Confirmer
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn--outline btn--sm"
                              onClick={() => setPending({ id: u.id, role: nextRole })}
                            >
                              {nextRole === 'admin' ? (
                                <>
                                  <ShieldPlus size={16} aria-hidden="true" /> Nommer admin
                                </>
                              ) : (
                                <>
                                  <ShieldOff size={16} aria-hidden="true" /> Retirer les droits
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
