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
  next: NextFunction,
): void {
  // Réponse déjà partiellement envoyée : on laisse Express couper la connexion.
  if (res.headersSent) {
    return next(err)
  }

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
    const { name, code, keyPattern } = err as { name?: string; code?: number; keyPattern?: Record<string, unknown> }
    if (name === 'CastError') {
      return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')
    }
    if (name === 'ValidationError') {
      return sendError(res, 400, 'INVALID_INPUT', 'Données invalides')
    }
    // Doublon sur un index unique : l'email (course entre deux inscriptions simultanées),
    // ou un autre index (ex. deux candidatures du même membre sur la même mission).
    if (code === 11000) {
      if (keyPattern && 'email' in keyPattern) {
        return sendError(res, 409, 'EMAIL_ALREADY_USED', 'Cet email est déjà utilisé')
      }
      return sendError(res, 409, 'CONFLICT', 'Cette ressource existe déjà')
    }
  }

  console.error('Erreur serveur non gérée :', err)
  sendError(res, 500, 'INTERNAL_ERROR', 'Une erreur interne est survenue')
}
