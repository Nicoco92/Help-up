import { Link } from 'react-router-dom'

// Logo texte « helpup. » : « up » en vert de marque, point final orange.
// Les logotypes sont exemptés des exigences de contraste WCAG (1.4.3 / 1.4.6) ;
// le nom accessible vient de l'aria-label du lien.
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="logo" aria-label="HelpUP, retour à l’accueil" onClick={onClick}>
      <span aria-hidden="true">
        help<span className="logo__accent">up</span>
        <span className="logo__dot">.</span>
      </span>
    </Link>
  )
}
