import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type SharedButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
  className?: string
}

type ButtonContent =
  | {
      children: ReactNode
      iconOnly?: false
      'aria-label'?: string
    }
  | {
      children?: never
      icon: ReactNode
      iconOnly: true
      'aria-label': string
    }

export type ButtonProps = SharedButtonProps & ButtonContent

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  iconOnly = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, `button--${size}`, iconOnly ? 'button--icon-only' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...props}>
      {icon && iconPosition === 'start' && <span className="button__icon">{icon}</span>}
      {!iconOnly && <span className="button__label">{children}</span>}
      {icon && iconPosition === 'end' && <span className="button__icon">{icon}</span>}
    </button>
  )
}
