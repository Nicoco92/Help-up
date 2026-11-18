import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { RouteAnnouncer } from './RouteAnnouncer'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const closeOnHistoryNavigation = () => setMobileOpen(false)
    window.addEventListener('popstate', closeOnHistoryNavigation)
    return () => window.removeEventListener('popstate', closeOnHistoryNavigation)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileOpen((open) => !open)
      return
    }
    setSidebarCollapsed((collapsed) => !collapsed)
  }

  return (
    <div
      className={`app-layout${isAuthenticated ? ' app-layout--with-sidebar' : ' app-layout--public'}${sidebarCollapsed ? ' app-layout--sidebar-collapsed' : ''}`}
    >
      {/* Lien d'évitement : premier élément atteint au clavier (RGAA 12.7) */}
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <RouteAnnouncer />
      <Navbar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onClose={() => setMobileOpen(false)}
      />
      <main id="contenu" tabIndex={-1} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
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
