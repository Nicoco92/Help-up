import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { passwordStrength } from '../utils/validation'

interface FieldShellProps {
  id: string
  label: string
  optional?: boolean
  hint?: ReactNode
  error?: string
  aside?: ReactNode
  children: ReactNode
}

function FieldShell({ id, label, optional, hint, error, aside, children }: FieldShellProps) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        <span>
          {label}
          {optional && <span className="field__optional"> (facultatif)</span>}
        </span>
        {aside}
      </label>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  optional?: boolean
  hint?: ReactNode
  error?: string
  icon?: LucideIcon
  aside?: ReactNode
}

export function TextField({
  label,
  optional,
  hint,
  error,
  icon: Icon,
  aside,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error} aside={aside}>
      <div className="field__control">
        {Icon && <Icon size={18} className="field__icon" aria-hidden="true" />}
        <input
          id={id}
          className={`input${Icon ? ' input--with-icon' : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...inputProps}
        />
      </div>
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string
  optional?: boolean
  hint?: ReactNode
  error?: string
}

export function TextAreaField({ label, optional, hint, error, ...props }: TextAreaFieldProps) {
  const id = useId()
  const length = typeof props.value === 'string' ? props.value.length : 0
  const counter = props.maxLength ? (
    <span className="field__optional">
      {length}/{props.maxLength}
    </span>
  ) : undefined
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      aside={counter}
    >
      <textarea
        id={id}
        className="textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'icon'> & { showStrength?: boolean }

const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Bon', 'Excellent']

export function PasswordField({
  label,
  hint,
  error,
  aside,
  showStrength,
  ...inputProps
}: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const value = typeof inputProps.value === 'string' ? inputProps.value : ''
  const score = showStrength ? passwordStrength(value) : 0

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} aside={aside}>
      <div className="field__control">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input input--with-action"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...inputProps}
        />
        <button
          type="button"
          className="field__action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showStrength && value && (
        <div className={`strength${score <= 1 ? ' strength--weak' : ''}`} aria-live="polite">
          <div className="strength__bars" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`strength__bar${n <= score ? ' is-on' : ''}`} />
            ))}
          </div>
          <span>Robustesse : {STRENGTH_LABELS[score]}</span>
        </div>
      )}
    </FieldShell>
  )
}
