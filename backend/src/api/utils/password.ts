import bcrypt from 'bcrypt'

// Coût bcrypt 12 (environ 250 ms par hachage, au-dessus du minimum OWASP de 10).
// Sous Jest, 4 : les tests créent des centaines de comptes et doivent rester rapides.
export const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12

// Hash d'un mot de passe quelconque, au même coût que les vrais : comparé quand l'email n'existe pas,
// pour que la connexion prenne le même temps dans les deux cas (pas d'énumération des comptes).
const DUMMY_HASH = bcrypt.hashSync('helpup-dummy-password-for-timing', SALT_ROUNDS)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Compare au hash du compte, ou au hash factice si le compte n'existe pas.
export async function comparePassword(password: string, hash: string | undefined): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH)
}

// Un hash créé avec un coût plus faible (anciens comptes, comptes de démo) est refait à la connexion.
export function needsRehash(hash: string): boolean {
  return bcrypt.getRounds(hash) < SALT_ROUNDS
}
