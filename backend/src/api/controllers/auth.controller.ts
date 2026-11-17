import type { Request, Response } from 'express'
import { registerSchema, loginSchema } from '../validators/auth.validator'
import { authService } from '../services/auth.service'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const data = registerSchema.parse(req.body)
    res.status(201).json(await authService.register(data))
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = loginSchema.parse(req.body)
    res.status(200).json(await authService.login(data))
  }
}

export const authController = new AuthController()
