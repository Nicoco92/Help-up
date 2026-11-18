import { Link } from 'react-router-dom'

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="logo" aria-label="HelpUP, retour à l’accueil" onClick={onClick}>
      <img className="logo__image" src="/helpup_logo.svg" alt="" />
    </Link>
  )
}
