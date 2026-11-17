import type { Request, RequestHandler } from 'express'
import { getOpenMission, searchOpenMissions } from '../services/explore.service'
import { UnauthorizedError } from '../utils/errors'
import { parseExploreQuery } from '../validators/explore.validator'

// requireAuth renseigne req.userId ; ce garde-fou ne sert que si la route est mal montée.
function authenticatedUserId(req: Request): string {
  if (!req.userId) {
    throw new UnauthorizedError('Authentification requise')
  }
  return req.userId
}

export const listExploreMissions: RequestHandler = async (req, res) => {
  const query = parseExploreQuery(req.query)
  const items = await searchOpenMissions(authenticatedUserId(req), query)
  res.status(200).json({ items })
}

export const readExploreMission: RequestHandler<{ id: string }> = async (req, res) => {
  const mission = await getOpenMission(authenticatedUserId(req), req.params.id)
  res.status(200).json(mission)
}
