import { Compass } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

export function SiteLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="HelpUP, accueil">
          <span className="brand-mark" aria-hidden="true">
            H
          </span>
          <span>HelpUP</span>
        </Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <NavLink to="/" end>
            <Compass size={18} aria-hidden="true" />
            <span>Missions</span>
          </NavLink>
        </nav>
        <span className="demo-indicator">
          <span aria-hidden="true" />
          Mode démo
        </span>
      </header>
      <Outlet />
      <footer className="site-footer">
        <span>HelpUP</span>
        <span>Les petits coups de main font les grands voisinages.</span>
      </footer>
    </div>
  )
}
