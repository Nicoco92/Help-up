import { Link } from 'react-router-dom'
import { HandHeart } from 'lucide-react'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="HelpUP, retour à l’accueil">
      <span className="logo__mark" aria-hidden="true">
        <HandHeart size={18} strokeWidth={2} />
      </span>
      <span>
        Help<span className="logo__accent">UP</span>
      </span>
    </Link>
  )
}
