import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <span role="status" style={{ display: 'inline-flex' }}>
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner />
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="state">
      <span className="state__icon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
