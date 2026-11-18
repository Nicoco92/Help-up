import type { PublicUser, User } from '../types/auth'

type Person = Pick<PublicUser, 'firstName' | 'lastName'>

export const fullName = (p: Person) => `${p.firstName} ${p.lastName}`.trim()

export const initials = (p: Person) =>
  `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase()

// 0612345678 → 06 12 34 56 78
export const formatPhone = (phone: string) => phone.replace(/(\d{2})(?=\d)/g, '$1 ')

// Date ISO → « il y a 5 min », « il y a 2 h », « hier », « 12 nov. »
export function formatWhen(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 24 * 60) return `il y a ${Math.floor(minutes / 60)} h`
  if (minutes < 48 * 60) return 'hier'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

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
