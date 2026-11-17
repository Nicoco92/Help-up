import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } })
}

function zodMessage(err: ZodError): string {
  const messages = err.issues.map((issue) =>
    issue.code === 'unrecognized_keys'
      ? `Champ non autorisé : ${issue.keys.join(', ')}`
      : issue.message,
  )
  return [...new Set(messages)].join('. ') || 'Données invalides'
}

// Route /api inconnue : même format d'erreur que le reste de l'API.
export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', 'Route introuvable')
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express reconnaît un gestionnaire d'erreurs à ses 4 paramètres.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message)
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, 'INVALID_INPUT', zodMessage(err))
  }

  // JSON malformé dans le corps (levé par express.json()).
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return sendError(res, 400, 'INVALID_INPUT', 'JSON malformé')
  }

  if (typeof err === 'object' && err !== null) {
    const { name, code } = err as { name?: string; code?: number }
    if (name === 'CastError') {
      return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')
    }
    if (name === 'ValidationError') {
      return sendError(res, 400, 'INVALID_INPUT', 'Données invalides')
    }
    // Index unique sur l'email (course entre deux inscriptions simultanées).
    if (code === 11000) {
      return sendError(res, 409, 'EMAIL_ALREADY_USED', 'Cet email est déjà utilisé')
    }
  }

  console.error('Erreur serveur non gérée :', err)
  sendError(res, 500, 'INTERNAL_ERROR', 'Une erreur interne est survenue')
}
