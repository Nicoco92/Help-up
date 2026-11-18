import {
    ChevronDown,
    ClipboardList,
    Compass,
    FileText,
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Monitor,
    Moon,
    PanelLeft,
    PanelLeftDashed,
    Plus,
    Shield,
    Sun,
    User as UserIcon,
    Users,
    X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import '../styles/messages.css'
import { fullName } from '../utils/format'
import { getThemePreference, saveThemePreference, type ThemePreference } from '../utils/theme'
import { Avatar } from './Avatar'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'

type NavbarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onClose: () => void
}

function AccountMenu({ onNavigate }: { onNavigate: () => void }) {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference)
  const ref = useRef<HTMLDivElement>(null)

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
    onNavigate()
    logout()
  }

  const handleNavigate = () => {
    setOpen(false)
    onNavigate()
  }

  const handleThemeChange = (preference: ThemePreference) => {
    setTheme(preference)
    saveThemePreference(preference)
  }

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-menu__trigger"
        aria-label={`Compte de ${user.firstName}`}
        aria-expanded={open}
        aria-controls="account-menu-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar {...user} size={34} />
        <span className="account-menu__name">{user.firstName}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu__panel" id="account-menu-panel">
          <div className="account-menu__header">
            <strong>{fullName(user)}</strong>
            <span>{user.email}</span>
          </div>
          <Link to="/profile" className="account-menu__item" onClick={handleNavigate}>
            <UserIcon size={18} aria-hidden="true" />
            Mon profil
          </Link>
          {isAdmin && (
            <Link to="/admin" className="account-menu__item" onClick={handleNavigate}>
              <Shield size={18} aria-hidden="true" />
              Administration
            </Link>
          )}
          <div className="account-menu__theme">
            <p className="account-menu__theme-label">Thème</p>
            <div className="account-menu__theme-options" role="group" aria-label="Choisir le thème">
              <button
                type="button"
                className={`account-menu__theme-option${theme === 'auto' ? ' is-selected' : ''}`}
                aria-pressed={theme === 'auto'}
                onClick={() => handleThemeChange('auto')}
              >
                <Monitor size={16} aria-hidden="true" />
                Auto
              </button>
              <button
                type="button"
                className={`account-menu__theme-option${theme === 'light' ? ' is-selected' : ''}`}
                aria-pressed={theme === 'light'}
                onClick={() => handleThemeChange('light')}
              >
                <Sun size={16} aria-hidden="true" />
                Clair
              </button>
              <button
                type="button"
                className={`account-menu__theme-option${theme === 'dark' ? ' is-selected' : ''}`}
                aria-pressed={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon size={16} aria-hidden="true" />
                Sombre
              </button>
            </div>
          </div>
          <button
            type="button"
            className="account-menu__item account-menu__item--danger"
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

export function Navbar({ collapsed, mobileOpen, onToggle, onClose }: NavbarProps) {
  const { isAuthenticated, status } = useAuth()
  const unreadMessages = useUnreadMessages(isAuthenticated)
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `navbar__link${isActive ? ' active' : ''}`

  if (!isAuthenticated) {
    return (
      <header className="public-navbar">
        <Logo />
        <div className="navbar__actions">
          {status === 'loading' ? null : (
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
      </header>
    )
  }

  return (
    <>
      <aside
        id="main-nav"
        className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--open' : ''}`}
        aria-label="Navigation principale"
      >
        <div className="sidebar__header">
          <Logo onClick={onClose} />
          <button
            type="button"
            className="sidebar__toggle"
            aria-label={collapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
            aria-expanded={!collapsed}
            onClick={onToggle}
          >
            {collapsed ? (
              <PanelLeftDashed size={20} aria-hidden="true" />
            ) : (
              <PanelLeft size={20} aria-hidden="true" />
            )}
          </button>
        </div>

        <Link
          to="/missions/new"
          className="sidebar__create"
          title="Créer une mission"
          aria-label="Créer une mission"
          onClick={onClose}
        >
          <Plus size={18} aria-hidden="true" />
          <span>Créer une mission</span>
        </Link>

        <nav className="sidebar__nav">
          <div className="sidebar__group">
            <p className="sidebar__group-label">Missions</p>
            <NavLink to="/missions" end className={linkClass} title="Explorer les missions" onClick={onClose}>
              <Compass size={18} aria-hidden="true" />
              <span>Explorer</span>
            </NavLink>
            <NavLink to="/missions/mine" className={linkClass} title="Mes missions" onClick={onClose}>
              <ClipboardList size={18} aria-hidden="true" />
              <span>Mes missions</span>
            </NavLink>
            <NavLink to="/applications" className={linkClass} title="Candidatures" onClick={onClose}>
              <FileText size={18} aria-hidden="true" />
              <span>Candidatures</span>
            </NavLink>
          </div>

          <div className="sidebar__group">
            <p className="sidebar__group-label">Communauté</p>
            <NavLink to="/messages" className={linkClass} title="Messages" onClick={onClose}>
              <MessageCircle size={18} aria-hidden="true" />
              <span>Messages</span>
              {unreadMessages > 0 && (
                <>
                  <span className="nav-count" aria-hidden="true">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                  <span className="visually-hidden">
                    , {unreadMessages} non lu{unreadMessages > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </NavLink>
            <NavLink to="/users" className={linkClass} title="Membres" onClick={onClose}>
              <Users size={18} aria-hidden="true" />
              <span>Membres</span>
            </NavLink>
          </div>

          <div className="sidebar__group">
            <p className="sidebar__group-label">Mon espace</p>
            <NavLink to="/dashboard" className={linkClass} title="Tableau de bord" onClick={onClose}>
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Tableau de bord</span>
            </NavLink>
            <NotificationBell onNavigate={onClose} />
            <NavLink to="/profile" className={linkClass} title="Mon profil" onClick={onClose}>
              <UserIcon size={18} aria-hidden="true" />
              <span>Mon profil</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar__account">
          <AccountMenu onNavigate={onClose} />
        </div>
      </aside>

      <div className="mobile-navbar">
        <button
          type="button"
          className="sidebar__toggle"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
          aria-controls="main-nav"
          onClick={onToggle}
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <PanelLeftDashed size={20} aria-hidden="true" />}
        </button>
        <Logo />
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={onClose}
        />
      )}
    </>
  )
}
