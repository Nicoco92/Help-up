import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RegisterPayload, UpdateProfilePayload, User } from '../types/auth'
import { ApiError, authApi, usersApi, tokenStorage, SESSION_EXPIRED_EVENT } from '../services/api'
import { AuthContext, type AuthStatus, type SessionEnd } from './AuthContextDefinition'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'loading' : 'anonymous',
  )
  const [sessionEnd, setSessionEnd] = useState<SessionEnd>(null)

  const startSession = useCallback((token: string, sessionUser: User) => {
    tokenStorage.set(token)
    setUser(sessionUser)
    setStatus('authenticated')
    setSessionEnd(null)
    return sessionUser
  }, [])

  const endSession = useCallback((reason: SessionEnd) => {
    tokenStorage.set(null)
    setUser(null)
    setStatus('anonymous')
    setSessionEnd(reason)
  }, [])

  const logout = useCallback(() => endSession('logout'), [endSession])
  const expire = useCallback(() => endSession('expired'), [endSession])

  // Au démarrage : le jeton stocké est-il toujours valide ? (le serveur seul peut le dire)
  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    usersApi
      .getMe()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch((err) => {
        if (cancelled) return
        // 401 : jeton expiré ou invalide. Autre erreur (API injoignable) : on garde le jeton
        // pour réessayer au prochain chargement, mais on affiche l'app en mode déconnecté.
        if (err instanceof ApiError && err.status === 401) expire()
        else setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [expire])

  // Une requête a reçu un 401 : le jeton a expiré pendant la navigation.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
  }, [expire])

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: me } = await authApi.login({ email, password })
      return startSession(token, me)
    },
    [startSession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { token, user: me } = await authApi.register(payload)
      return startSession(token, me)
    },
    [startSession],
  )

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updated = await usersApi.updateMe(payload)
    setUser(updated)
    return updated
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      sessionEnd,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, status, sessionEnd, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
