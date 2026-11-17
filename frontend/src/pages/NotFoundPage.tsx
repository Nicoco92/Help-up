import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/States'

export function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState
        icon={Compass}
        title="Page introuvable"
        action={
          <Link to="/" className="btn btn--primary">
            Retour à l’accueil
          </Link>
        }
      >
        Cette page n’existe pas ou a été déplacée.
      </EmptyState>
    </div>
  )
}
