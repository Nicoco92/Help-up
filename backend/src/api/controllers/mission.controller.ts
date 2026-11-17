import type { Request, Response } from 'express'
import { missionService } from '../services/mission.service'
import { UnauthorizedError } from '../utils/errors'
import {
  createMissionSchema,
  listMissionsQuerySchema,
  updateMissionSchema,
} from '../validators/mission.validator'

// Express 5 transmet les erreurs des fonctions async au gestionnaire d'erreurs : pas de try/catch.

// requireAuth renseigne req.userId ; ce garde-fou ne sert que si la route est mal montée.
function ownerId(req: Request): string {
  if (!req.userId) throw new UnauthorizedError('Authentification requise')
  return req.userId
}

function paramId(req: Request): string {
  const { id } = req.params
  return Array.isArray(id) ? id[0] : id
}

export class MissionController {
  async list(req: Request, res: Response): Promise<void> {
    const query = listMissionsQuerySchema.parse(req.query)
    res.status(200).json({ items: await missionService.list(ownerId(req), query) })
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = createMissionSchema.parse(req.body)
    res.status(201).json(await missionService.create(ownerId(req), data))
  }

  async get(req: Request, res: Response): Promise<void> {
    res.status(200).json(await missionService.get(ownerId(req), paramId(req)))
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = updateMissionSchema.parse(req.body)
    res.status(200).json(await missionService.update(ownerId(req), paramId(req), data))
  }

  async remove(req: Request, res: Response): Promise<void> {
    await missionService.removeAsAdmin(paramId(req))
    res.status(204).end()
  }
}

export const missionController = new MissionController()
