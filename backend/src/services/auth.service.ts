import { User, type IUserDocument } from '../models/user.model'
import { hashPassword, comparePassword } from '../utils/password'
import { signToken } from '../utils/jwt'
import { ConflictError, UnauthorizedError } from '../utils/errors'
import type { RegisterInput, LoginInput } from '../validators/auth.validator'

export interface AuthResult {
  user: ReturnType<IUserDocument['toJSON']>
  token: string
}

// Hash bcrypt d'un mot de passe quelconque : comparé quand l'email n'existe pas, pour que
// la réponse prenne le même temps dans les deux cas (pas d'énumération des comptes).
const DUMMY_HASH = '$2b$10$rJXZBwl3.UzVc43cXTrXc.0jij66RcOj4omhj73gOjAy1Ofw9fSJe'

function toAuthResult(user: IUserDocument): AuthResult {
  return { user: user.toJSON(), token: signToken(user.id) }
}

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResult> {
    const existingUser = await User.exists({ email: data.email })
    if (existingUser) {
      throw new ConflictError('Cet email est déjà utilisé', 'EMAIL_ALREADY_USED')
    }

    const user = await User.create({
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      bio: data.bio,
      skills: data.skills ?? [],
      role: 'client',
    })

    return toAuthResult(user)
  }

  async login(data: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: data.email }).select('+passwordHash')
    const isPasswordValid = await comparePassword(data.password, user?.passwordHash ?? DUMMY_HASH)

    if (!user || !isPasswordValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect', 'UNAUTHORIZED')
    }

    return toAuthResult(user)
  }
}

export const authService = new AuthService()
