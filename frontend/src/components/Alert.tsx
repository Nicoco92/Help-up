import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

interface AlertProps {
  variant?: 'error' | 'success' | 'info'
  children: ReactNode
  onClose?: () => void
}

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info }

export function Alert({ variant = 'info', children, onClose }: AlertProps) {
  const Icon = ICONS[variant]
  return (
    <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div className="alert__body">{children}</div>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Fermer">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
