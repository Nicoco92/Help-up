import type { Request, Response } from 'express'
import { updateProfileSchema, updateRoleSchema } from '../validators/user.validator'
import { userService } from '../services/user.service'
import { UnauthorizedError } from '../utils/errors'
import type { IUserDocument } from '../models/user.model'

// Express 5 transmet automatiquement les erreurs des fonctions async au gestionnaire d'erreurs :
// pas besoin de try/catch ni de next(err) dans les contrôleurs.

function currentUser(req: Request): IUserDocument {
  if (!req.user) throw new UnauthorizedError('Authentification requise')
  return req.user
}

function paramId(req: Request): string {
  const { id } = req.params
  return Array.isArray(id) ? id[0] : id
}

export class UserController {
  async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json(await userService.getMe(currentUser(req).id))
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    // .strict() rejette déjà id, _id, ownerId, email, role… avec un 400 INVALID_INPUT.
    const data = updateProfileSchema.parse(req.body)
    res.status(200).json(await userService.updateMe(currentUser(req).id, data))
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    res.status(200).json(await userService.getUserById(paramId(req), currentUser(req)))
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    res.status(200).json({ items: await userService.listUsers(currentUser(req)) })
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    const { role } = updateRoleSchema.parse(req.body)
    res.status(200).json(await userService.updateUserRole(paramId(req), role, currentUser(req)))
  }
}

export const userController = new UserController()
