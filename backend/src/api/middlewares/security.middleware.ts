import type { Request, Response, NextFunction } from 'express'

// Les réponses de l'API contiennent des données personnelles et des jetons :
// aucun cache (navigateur, proxy) ne doit les garder (OWASP ASVS 8.2.1).
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.set('Cache-Control', 'no-store')
  res.set('Pragma', 'no-cache')
  next()
}
