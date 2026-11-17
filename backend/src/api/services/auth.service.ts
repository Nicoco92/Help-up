import { User, type IUserDocument } from '../../models/user.model'
import { hashPassword, comparePassword, needsRehash } from '../utils/password'
import { signToken } from '../utils/jwt'
import { ConflictError, UnauthorizedError } from '../utils/errors'
import type { RegisterInput, LoginInput } from '../validators/auth.validator'

export interface AuthResult {
  user: ReturnType<IUserDocument['toJSON']>
  token: string
}

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
    // Compte absent : comparaison avec un hash factice, même durée de réponse (pas d'énumération).
    const isPasswordValid = await comparePassword(data.password, user?.passwordHash)

    if (!user || !isPasswordValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect', 'UNAUTHORIZED')
    }

    // Hash créé avec un coût bcrypt plus faible : on le refait maintenant qu'on connaît le mot de passe.
    if (needsRehash(user.passwordHash)) {
      user.passwordHash = await hashPassword(data.password)
      await user.save()
    }

    return toAuthResult(user)
  }
}

export const authService = new AuthService()
