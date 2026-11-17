import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from './States'

// Ces gardes ne font que de l'ergonomie (rediriger au bon endroit).
// La sécurité réelle est assurée par l'API : sans JWT valide, elle répond 401.

export function RequireAuth() {
  const { status, sessionEnd } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <PageLoader />
  if (status === 'anonymous') {
    // Déconnexion volontaire : retour à l'accueil. Sinon : connexion, puis retour sur cette page.
    if (sessionEnd === 'logout') return <Navigate to="/" replace />
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, expired: sessionEnd === 'expired' }}
      />
    )
  }
  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}
