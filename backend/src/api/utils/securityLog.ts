import type { Request } from 'express'

// Journal de sécurité (OWASP A09) : une ligne JSON par événement, lisible par un outil de supervision.
// Jamais de mot de passe, de jeton ni d'email en clair : l'IP, la route et un identifiant suffisent.
export type SecurityEvent =
  | 'login_failed'
  | 'rate_limited'
  | 'auth_rejected'
  | 'forbidden'
  | 'password_rehashed'

export function securityLog(event: SecurityEvent, req: Request, details: Record<string, unknown> = {}): void {
  // Les tests produiraient des centaines de lignes : silence sous Jest
  if (process.env.NODE_ENV === 'test') return
  console.warn(
    JSON.stringify({
      level: 'security',
      event,
      at: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      ...details,
    }),
  )
}
