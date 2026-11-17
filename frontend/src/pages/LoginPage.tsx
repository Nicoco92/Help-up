import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'
import { AuthLayout } from '../components/AuthLayout'
import { TextField, PasswordField } from '../components/Field'
import { Alert } from '../components/Alert'
import { PageLoader, Spinner } from '../components/States'
import { focusFirstInvalid, hasErrors, validateEmail, type FieldErrors } from '../utils/validation'

type LoginField = 'email' | 'password'

export function LoginPage() {
  const { login, status } = useAuth()
  const location = useLocation()
  // Page demandée avant la redirection vers la connexion (voir RequireAuth).
  const state = location.state as { from?: string; expired?: boolean } | null
  const from = state?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const nextErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Indique ton mot de passe.',
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return focusFirstInvalid()

    setSubmitting(true)
    try {
      // Une fois connecté, le rendu ci-dessous redirige vers « from ».
      await login(email.trim(), password)
    } catch (err) {
      // 401 : on ne précise jamais si c'est l'email ou le mot de passe qui est faux.
      setFormError(
        err instanceof ApiError && err.status === 401
          ? 'Email ou mot de passe incorrect.'
          : err instanceof Error
            ? err.message
            : 'Connexion impossible. Réessaie dans un instant.',
      )
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return <PageLoader />
  if (status === 'authenticated') return <Navigate to={from} replace />

  return (
    <AuthLayout title="Content de te revoir" subtitle="Connecte-toi pour retrouver ton espace HelpUP.">
      <form className="auth__form stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        {!formError && state?.expired && (
          <Alert variant="info">Ta session a expiré. Reconnecte-toi pour continuer.</Alert>
        )}

        <TextField
          label="Adresse email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          placeholder="prenom.nom@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus
        />

        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          placeholder="Ton mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          {submitting ? <Spinner label="Connexion en cours" /> : 'Se connecter'}
        </button>
      </form>

      <p className="auth__switch">
        Pas encore de compte ? <Link to="/register">Crée-le gratuitement</Link>
      </p>
    </AuthLayout>
  )
}
