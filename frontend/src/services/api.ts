import type {
  AuthResponse,
  PublicUser,
  RegisterPayload,
  UpdateProfilePayload,
  User,
  UserRole,
} from '../types/auth'
import type { Mission, MissionListResponse } from '../types/mission'
import type { Application } from '../types/application'
import type { Dashboard } from '../types/dashboard'
import type { Review, ReviewPayload, UserReviews } from '../types/review'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const TOKEN_KEY = 'helpup.token'

// Émis quand l'API répond 401 sur une route protégée (jeton expiré ou révoqué).
export const SESSION_EXPIRED_EVENT = 'helpup:session-expired'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Le JWT est gardé dans le localStorage : simple pour un MVP, mais exposé en cas de faille XSS.
// En production, on préférerait un cookie httpOnly posé par l'API.
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Stockage indisponible (navigation privée stricte) : la session ne survivra pas au rechargement.
    }
  },
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
  } catch (cause) {
    // Requête annulée (démontage du composant) : on laisse passer l'AbortError, ce n'est pas une panne réseau.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.',
    )
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token && !endpoint.startsWith('/auth/')) {
      tokenStorage.set(null)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw new ApiError(
      response.status,
      data?.error?.code ?? 'UNKNOWN_ERROR',
      data?.error?.message ?? 'Une erreur est survenue. Réessaie dans un instant.',
    )
  }

  return data as T
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
})

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', json('POST', payload)),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', json('POST', payload)),
}

export const usersApi = {
  getMe: () => request<User>('/users/me'),
  updateMe: (payload: UpdateProfilePayload) => request<User>('/users/me', json('PATCH', payload)),
  list: () => request<{ items: PublicUser[] }>('/users'),
  getById: (id: string) => request<PublicUser>(`/users/${encodeURIComponent(id)}`),
  updateRole: (id: string, role: UserRole) =>
    request<User>(`/users/${encodeURIComponent(id)}/role`, json('PATCH', { role })),
}

// Recherche des missions ouvertes des autres membres (JWT obligatoire côté API).
export const exploreApi = {
  list: (query: string, signal?: AbortSignal) =>
    request<MissionListResponse>(`/explore/missions${query ? `?${query}` : ''}`, { signal }),
  getById: (id: string, signal?: AbortSignal) =>
    request<Mission>(`/explore/missions/${encodeURIComponent(id)}`, { signal }),
}

// Candidatures : les miennes (/applications) et celles reçues sur mes missions (/missions/:id/applications).
export const applicationsApi = {
  listMine: () => request<{ items: Application[] }>('/applications'),
  create: (payload: { missionId: string; message: string }) =>
    request<Application>('/applications', json('POST', payload)),
  update: (id: string, message: string) =>
    request<Application>(`/applications/${encodeURIComponent(id)}`, json('PATCH', { message })),
  remove: (id: string) =>
    request<void>(`/applications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listForMission: (missionId: string) =>
    request<{ items: Application[] }>(`/missions/${encodeURIComponent(missionId)}/applications`),
  accept: (missionId: string, applicationId: string) =>
    request<Application>(
      `/missions/${encodeURIComponent(missionId)}/applications/${encodeURIComponent(applicationId)}/accept`,
      { method: 'POST' },
    ),
  reject: (missionId: string, applicationId: string) =>
    request<Application>(
      `/missions/${encodeURIComponent(missionId)}/applications/${encodeURIComponent(applicationId)}/reject`,
      { method: 'POST' },
    ),
}

// Tableau de bord et clôture d'une de mes missions (assigned → completed).
export const dashboardApi = {
  get: () => request<Dashboard>('/dashboard'),
  completeMission: (missionId: string) =>
    request<Mission>(`/missions/${encodeURIComponent(missionId)}/complete`, { method: 'POST' }),
}

// Avis : ceux que j'écris (/reviews) et ceux reçus par un membre (/users/:id/reviews).
export const reviewsApi = {
  listMine: () => request<{ items: Review[] }>('/reviews'),
  create: (missionId: string, payload: ReviewPayload) =>
    request<Review>('/reviews', json('POST', { missionId, ...payload })),
  update: (id: string, payload: Partial<ReviewPayload>) =>
    request<Review>(`/reviews/${encodeURIComponent(id)}`, json('PATCH', payload)),
  remove: (id: string) => request<void>(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listForUser: (userId: string) => request<UserReviews>(`/users/${encodeURIComponent(userId)}/reviews`),
}
