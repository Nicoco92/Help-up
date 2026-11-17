import type { PublicUser, User } from '../types/auth'

type Person = Pick<PublicUser, 'firstName' | 'lastName'>

export const fullName = (p: Person) => `${p.firstName} ${p.lastName}`.trim()

export const initials = (p: Person) =>
  `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase()

// 0612345678 → 06 12 34 56 78
export const formatPhone = (phone: string) => phone.replace(/(\d{2})(?=\d)/g, '$1 ')

export function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// Champs facultatifs qui rendent un profil plus rassurant pour les autres membres.
export function profileCompletion(user: User): { percent: number; missing: string[] } {
  const checks: Array<[boolean, string]> = [
    [Boolean(user.city), 'ta ville'],
    [Boolean(user.bio), 'une courte présentation'],
    [user.skills.length > 0, 'tes compétences'],
    [Boolean(user.phone), 'ton téléphone'],
  ]
  const done = checks.filter(([ok]) => ok).length
  return {
    percent: Math.round(((done + 1) / (checks.length + 1)) * 100),
    missing: checks.filter(([ok]) => !ok).map(([, label]) => label),
  }
}
