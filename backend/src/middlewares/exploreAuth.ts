import type { NextFunction, Request, Response } from 'express'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import { ExploreError } from '../utils/ExploreError'

declare module 'express-serve-static-core' {
  interface Locals {
    userId?: string
  }
}

export function requireExploreAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.get('authorization')
  const match = authorization?.match(/^Bearer\s+(\S+)$/i)

  if (!match) {
    return next(new ExploreError(401, 'UNAUTHORIZED', 'Authentification requise.'))
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return next(new Error('JWT_SECRET manquant.'))
  }

  let payload: string | jwt.JwtPayload
  try {
    payload = jwt.verify(match[1], secret)
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return next(new ExploreError(401, 'UNAUTHORIZED', 'Jeton invalide ou expiré.'))
    }
    return next(error)
  }

  const userId = typeof payload === 'string' ? undefined : payload.sub
  if (!userId || !/^[a-f\d]{24}$/i.test(userId)) {
    return next(new ExploreError(401, 'UNAUTHORIZED', 'Jeton invalide ou expiré.'))
  }

  res.locals.userId = userId
  return next()
}
