import type { ReactNode } from 'react'
import { BadgeCheck, HandCoins, MapPin } from 'lucide-react'

const POINTS = [
  {
    icon: MapPin,
    title: 'Près de chez toi',
    text: 'Des missions dans ton quartier, sans traverser la ville.',
  },
  {
    icon: HandCoins,
    title: 'Une prime claire',
    text: 'Le montant est fixé avant la mission, pas de mauvaise surprise.',
  },
  {
    icon: BadgeCheck,
    title: 'Des profils de confiance',
    text: 'Avis réciproques après chaque mission.',
  },
]

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <div style={{ position: 'relative' }}>
          <h2>Une mission près de chez toi&nbsp;?</h2>
          <p>Rejoins les voisins qui s’entraident pour les petits services du quotidien.</p>
        </div>
        <ul className="auth__points">
          {POINTS.map(({ icon: Icon, title: t, text }) => (
            <li key={t}>
              <span className="auth__point-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <div>
                <strong>{t}</strong>
                <span>{text}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <div className="auth__main">
        <div className="auth__panel">
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
