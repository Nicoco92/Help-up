export type UserRole = 'client' | 'admin'

// Profil complet : renvoyé pour son propre compte (et à un administrateur).
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  city?: string
  bio?: string
  skills: string[]
  role: UserRole
  avatarUrl?: string
  createdAt: string
  updatedAt?: string
}

// Profil vu par un autre membre : ni email ni téléphone, nom réduit à l'initiale.
export interface PublicUser {
  id: string
  firstName: string
  lastName: string
  city?: string
  bio?: string
  skills: string[]
  avatarUrl?: string
  createdAt: string
  // Présents seulement pour son propre profil ou pour un administrateur.
  email?: string
  phone?: string
  role?: UserRole
}

export interface AuthResponse {
  user: User
  token: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}

// Une chaîne vide efface la valeur côté serveur.
export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
  city?: string
  bio?: string
  skills?: string[]
}
