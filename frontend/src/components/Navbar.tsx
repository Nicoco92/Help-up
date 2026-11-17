import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Compass, FileText, LogOut, Menu, Shield, User as UserIcon, Users, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { fullName } from '../utils/format'

function AccountMenu() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const handleLogout = () => {
    setOpen(false)
    // Sur une page protégée, RequireAuth renvoie alors vers l'accueil.
    logout()
  }

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-menu__trigger"
        aria-label={`Menu du compte de ${user.firstName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar {...user} size={34} />
        <span className="account-menu__name">{user.firstName}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu__panel" role="menu">
          <div className="account-menu__header">
            <strong>{fullName(user)}</strong>
            <span>{user.email}</span>
          </div>
          <Link
            to="/profile"
            className="account-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <UserIcon size={18} aria-hidden="true" />
            Mon profil
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="account-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <Shield size={18} aria-hidden="true" />
              Administration
            </Link>
          )}
          <button
            type="button"
            className="account-menu__item account-menu__item--danger"
            role="menuitem"
            onClick={handleLogout}
          >
            <LogOut size={18} aria-hidden="true" />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { isAuthenticated, status } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Referme le menu mobile à chaque changement de page.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `navbar__link${isActive ? ' active' : ''}`

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />

        {isAuthenticated && (
          <nav
            id="main-nav"
            className={`navbar__links${mobileOpen ? ' is-open' : ''}`}
            aria-label="Navigation principale"
          >
            <NavLink to="/missions" className={linkClass}>
              <Compass size={18} aria-hidden="true" />
              Missions
            </NavLink>
            <NavLink to="/applications" className={linkClass}>
              <FileText size={18} aria-hidden="true" />
              Candidatures
            </NavLink>
            <NavLink to="/users" className={linkClass}>
              <Users size={18} aria-hidden="true" />
              Membres
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <UserIcon size={18} aria-hidden="true" />
              Mon profil
            </NavLink>
          </nav>
        )}

        <div className="navbar__actions">
          {status === 'loading' ? null : isAuthenticated ? (
            <>
              <AccountMenu />
              <button
                type="button"
                className="btn btn--ghost btn--icon navbar__burger"
                aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileOpen}
                aria-controls="main-nav"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">
                Se connecter
              </Link>
              <Link to="/register" className="btn btn--secondary navbar__cta">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
