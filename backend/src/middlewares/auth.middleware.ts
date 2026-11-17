import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { UnauthorizedError, ForbiddenError } from '../utils/errors'
import { User } from '../models/user.model'
import type { UserRole } from '../constants/roles'

// Lit « Authorization: Bearer <JWT> », vérifie la signature et l'expiration, puis recharge
// l'utilisateur en base (compte supprimé ou rôle modifié = pris en compte immédiatement).
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Jeton d’authentification manquant')
  }

  let userId: string
  try {
    userId = verifyToken(token).sub
  } catch {
    throw new UnauthorizedError('Jeton d’authentification invalide ou expiré')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new UnauthorizedError('Jeton d’authentification invalide ou expiré')
  }

  req.user = user
  req.userId = user.id
  next()
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentification requise')
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Action réservée aux administrateurs')
    }
    next()
  }
}
