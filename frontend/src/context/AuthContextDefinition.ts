import { createContext } from 'react'
import type { RegisterPayload, UpdateProfilePayload, User } from '../types/auth'

// « loading » : on vérifie au démarrage si le jeton stocké est encore valide.
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

// Comment la dernière session s'est terminée : déconnexion volontaire ou jeton expiré.
export type SessionEnd = 'logout' | 'expired' | null

export interface AuthContextType {
  user: User | null
  status: AuthStatus
  sessionEnd: SessionEnd
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
