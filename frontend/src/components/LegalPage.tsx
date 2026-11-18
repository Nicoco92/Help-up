import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LEGAL_PAGES, LEGAL_UPDATED_AT } from '../constants/legal'
import '../styles/legal.css'

interface LegalPageProps {
  title: string
  intro: ReactNode
  children: ReactNode
}

// Gabarit commun des pages légales : titre, date de mise à jour, sections, liens vers les autres pages.
export function LegalPage({ title, intro, children }: LegalPageProps) {
  return (
    <div className="page legal">
      <div className="container">
        <header className="legal__header">
          <p className="legal__eyebrow">Informations légales</p>
          <h1>{title}</h1>
          <p className="legal__intro">{intro}</p>
          <p className="legal__updated">Dernière mise à jour : {LEGAL_UPDATED_AT}</p>
        </header>

        <div className="legal__body">{children}</div>

        <nav className="legal__nav" aria-label="Informations légales">
          <ul>
            {LEGAL_PAGES.map((page) => (
              <li key={page.to}>
                <NavLink to={page.to}>{page.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

// Lien vers un autre site : nouvel onglet, annoncé aux lecteurs d'écran (RGAA 13.2)
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (s’ouvre dans un nouvel onglet)</span>
    </a>
  )
}
