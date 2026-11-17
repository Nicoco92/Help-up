const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = window.localStorage.getItem('token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBase}${path}`, { ...options, headers })
  const payload: unknown = await response.json()

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload
    throw new ApiError(
      errorPayload.error?.message ?? 'Une erreur est survenue.',
      response.status,
      errorPayload.error?.code ?? 'UNKNOWN_ERROR',
    )
  }

  return payload as T
}
