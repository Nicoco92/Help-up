import jwt from 'jsonwebtoken'

// Le jeton ne transporte que l'identifiant (claim standard « sub ») : le rôle et l'email
// sont relus en base à chaque requête par le middleware, donc jamais périmés.
export interface TokenPayload {
  sub: string
}

// Algorithme imposé à la vérification : un jeton « alg: none » ou signé autrement est refusé.
const ALGORITHM = 'HS256'
// Émetteur et destinataire vérifiés : un jeton signé pour une autre application est refusé.
const ISSUER = 'helpup-api'
const AUDIENCE = 'helpup-web'
// HS256 : au moins 256 bits de secret (openssl rand -hex 32 donne 64 caractères)
const MIN_SECRET_LENGTH = 32
const WEAK_SECRETS = new Set(['change-me', 'changeme', 'secret', 'jwt-secret'])

let warned = false

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    // Seuls les tests Jest (NODE_ENV=test) tournent sans secret ; ailleurs on refuse de démarrer.
    if (process.env.NODE_ENV === 'test') return 'test-only-secret-never-used-outside-jest'
    throw new Error('JWT_SECRET manquant (fichier .env à la racine du projet)')
  }
  if (secret.length < MIN_SECRET_LENGTH || WEAK_SECRETS.has(secret.toLowerCase())) {
    const message = `JWT_SECRET trop faible (${MIN_SECRET_LENGTH} caractères minimum) : le générer avec « openssl rand -hex 32 »`
    // En production on refuse de démarrer ; en développement on prévient une fois.
    if (process.env.NODE_ENV === 'production') throw new Error(message)
    if (!warned) {
      warned = true
      console.warn(`ATTENTION : ${message}`)
    }
  }
  return secret
}

// Appelée par server.ts : un secret absent ou trop faible est détecté au démarrage, pas à la 1re connexion.
export function assertJwtSecret(): void {
  getJwtSecret()
}

export function signToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: ALGORITHM,
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    // Durée courte par défaut : un jeton volé ne sert pas longtemps.
    expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  })
  // Le sujet doit être un ObjectId : rien d'autre n'est envoyé à la base.
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || !/^[a-f\d]{24}$/i.test(payload.sub)) {
    throw new jwt.JsonWebTokenError('Jeton sans sujet valide')
  }
  return { sub: payload.sub }
}
