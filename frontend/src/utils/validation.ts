// Validation côté navigateur : uniquement pour guider l'utilisateur.
// La vraie validation (zod) est faite par l'API, qui ne fait jamais confiance au front.

export type FieldErrors<K extends string> = Partial<Record<K, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^0[1-9][0-9]{8}$/

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Indique ton adresse email.'
  if (!EMAIL_RE.test(value.trim())) return 'Cette adresse email ne semble pas valide.'
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Choisis un mot de passe.'
  if (value.length < 8) return 'Choisis un mot de passe d’au moins 8 caractères.'
  if (value.length > 72) return 'Ton mot de passe ne doit pas dépasser 72 caractères.'
}

export function validateName(value: string, label: 'prénom' | 'nom'): string | undefined {
  if (!value.trim()) return `Indique ton ${label}.`
  if (value.trim().length > 50) return `Ton ${label} ne doit pas dépasser 50 caractères.`
}

export function validatePhone(value: string): string | undefined {
  const v = value.replace(/[\s.-]/g, '')
  if (v && !PHONE_RE.test(v)) return 'Indique un numéro à 10 chiffres, par exemple 06 12 34 56 78.'
}

export const normalizePhone = (value: string) => value.replace(/[\s.-]/g, '')

// Score indicatif de 0 à 4 (longueur + variété des caractères).
export function passwordStrength(value: string): number {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++
  return Math.max(1, score)
}

export const hasErrors = (errors: Record<string, string | undefined>) =>
  Object.values(errors).some(Boolean)

// Après une soumission refusée, place le focus (et donc le scroll) sur le premier champ en erreur.
export function focusFirstInvalid(): void {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  })
}
