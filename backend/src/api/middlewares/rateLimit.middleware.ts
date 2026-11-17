import { rateLimit, type Options } from 'express-rate-limit'
import { securityLog } from '../utils/securityLog'

// Limitation du nombre de requêtes par adresse IP (OWASP A07 : force brute, A04 : abus).
// Réponse 429 au format d'erreur commun. Désactivée sous Jest, sauf dans tests/security.test.ts
// qui la réactive avec RATE_LIMIT_IN_TESTS=true pour vérifier qu'elle fonctionne.
const common: Partial<Options> = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_IN_TESTS !== 'true',
  handler: (req, res, _next, options) => {
    securityLog('rate_limited', req, { limit: options.limit })
    res.status(429).json({
      error: { code: 'TOO_MANY_REQUESTS', message: String(options.message) },
    })
  },
}

// Connexion : 10 échecs par quart d'heure et par IP. Les connexions réussies ne comptent pas,
// pour qu'une démo qui change souvent de compte ne soit jamais bloquée.
export const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.',
})

// Inscription : 20 comptes par heure et par IP (création de faux comptes en masse)
export const registerLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: 'Trop de créations de compte depuis cette adresse. Réessaie plus tard.',
})

// Toute l'API : 300 requêtes par minute et par IP (la cloche interroge l'API toutes les 30 s)
export const apiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 300,
  message: 'Trop de requêtes. Réessaie dans une minute.',
})
