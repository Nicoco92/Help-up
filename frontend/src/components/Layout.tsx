import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { RouteAnnouncer } from './RouteAnnouncer'

export function Layout() {
  return (
    <>
      {/* Lien d'évitement : premier élément atteint au clavier (RGAA 12.7) */}
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <RouteAnnouncer />
      <Navbar />
      <main id="contenu" tabIndex={-1} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} HelpUP · Un coup de main, une petite prime.</span>
        <span>Projet étudiant Efrei · Full Stack JS</span>
      </div>
    </footer>
  )
}
