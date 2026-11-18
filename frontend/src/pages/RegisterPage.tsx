import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api'
import { AuthLayout } from '../components/AuthLayout'
import { TextField, PasswordField } from '../components/Field'
import { Alert } from '../components/Alert'
import { PageLoader, Spinner } from '../components/States'
import {
  focusFirstInvalid,
  hasErrors,
  validateEmail,
  validateName,
  validatePassword,
  type FieldErrors,
} from '../utils/validation'

type RegisterField = 'firstName' | 'lastName' | 'email' | 'password'

// Inscription volontairement courte : les informations facultatives (ville, bio, compétences…)
// se complètent ensuite depuis le profil.
export function RegisterPage() {
  const { register, status } = useAuth()
  // Vrai dès qu'une inscription est lancée : un compte tout juste créé part vers son profil,
  // un membre déjà connecté qui ouvre /register retourne à l'accueil.
  const [justRegistered, setJustRegistered] = useState(false)

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: RegisterField) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    // L'erreur disparaît dès que l'utilisateur corrige le champ.
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const nextErrors = {
      firstName: validateName(form.firstName, 'prénom'),
      lastName: validateName(form.lastName, 'nom'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    }
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return focusFirstInvalid()

    setSubmitting(true)
    setJustRegistered(true)
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_USED') {
        setErrors({ email: 'Un compte existe déjà avec cette adresse. Connecte-toi plutôt.' })
      } else {
        setFormError(err instanceof Error ? err.message : 'Inscription impossible. Réessaie.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return <PageLoader />
  if (status === 'authenticated') {
    return justRegistered ? (
      <Navigate to="/profile" replace state={{ welcome: true }} />
    ) : (
      <Navigate to="/" replace />
    )
  }

  return (
    <AuthLayout title="Crée ton compte" subtitle="Gratuit, sans engagement, en moins d’une minute.">
      <form className="auth__form stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <div className="grid-2">
          <TextField
            label="Prénom"
            name="firstName"
            autoComplete="given-name"
            placeholder="Camille"
            value={form.firstName}
            onChange={update('firstName')}
            error={errors.firstName}
            maxLength={50}
            autoFocus
          />
          <TextField
            label="Nom"
            name="lastName"
            autoComplete="family-name"
            placeholder="Martin"
            value={form.lastName}
            onChange={update('lastName')}
            error={errors.lastName}
            maxLength={50}
            hint="Seule l’initiale est visible des autres membres."
          />
        </div>

        <TextField
          label="Adresse email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          placeholder="prenom.nom@exemple.fr"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />

        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint="Au moins 8 caractères. Mélange lettres, chiffres et symboles."
          showStrength
          maxLength={72}
        />

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          {submitting ? <Spinner label="Création du compte" /> : 'Créer mon compte'}
        </button>
      </form>

      <p className="auth__legal">
        En créant un compte, tu acceptes les <Link to="/conditions">conditions d’utilisation</Link> de HelpUP.
        Pour savoir ce que nous faisons de tes données, lis la page{' '}
        <Link to="/confidentialite">Confidentialité</Link>.
      </p>
      <p className="auth__switch">
        Déjà inscrit ? <Link to="/login">Connecte-toi</Link>
      </p>
    </AuthLayout>
  )
}
