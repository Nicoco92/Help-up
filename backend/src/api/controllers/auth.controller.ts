import type { Request, Response } from 'express'
import { registerSchema, loginSchema } from '../validators/auth.validator'
import { authService } from '../services/auth.service'
import { UnauthorizedError } from '../utils/errors'
import { securityLog } from '../utils/securityLog'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const data = registerSchema.parse(req.body)
    res.status(201).json(await authService.register(data))
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = loginSchema.parse(req.body)
    try {
      res.status(200).json(await authService.login(data))
    } catch (err) {
      // Échec tracé (IP, route), sans l'email ni le mot de passe.
      if (err instanceof UnauthorizedError) securityLog('login_failed', req)
      throw err
    }
  }
}

export const authController = new AuthController()
