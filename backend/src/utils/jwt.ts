import jwt from 'jsonwebtoken'

// Le jeton ne transporte que l'identifiant (claim standard « sub ») : le rôle et l'email
// sont relus en base à chaque requête par le middleware, donc jamais périmés.
export interface TokenPayload {
  sub: string
}

const ALGORITHM = 'HS256'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  // Seuls les tests Jest (NODE_ENV=test) tournent sans secret ; ailleurs on refuse de démarrer.
  if (process.env.NODE_ENV === 'test') return 'test-only-secret'
  throw new Error('JWT_SECRET manquant (fichier .env à la racine du projet)')
}

export function signToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: ALGORITHM,
    subject: userId,
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, getJwtSecret(), { algorithms: [ALGORITHM] })
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new jwt.JsonWebTokenError('Jeton sans sujet')
  }
  return { sub: payload.sub }
}
