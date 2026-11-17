import type { RequestHandler } from 'express'
import { getOpenMission, searchOpenMissions } from '../services/explore.service'
import AppError from '../utils/AppError'
import { parseExploreQuery } from '../validators/explore.validator'

function authenticatedUserId(value: unknown): string {
  if (typeof value !== 'string') {
    throw AppError.unauthorized('Authentification requise.')
  }
  return value
}

export const listExploreMissions: RequestHandler = async (req, res) => {
  const query = parseExploreQuery(req.query)
  const items = await searchOpenMissions(authenticatedUserId(res.locals.userId), query)
  res.status(200).json({ items })
}

export const readExploreMission: RequestHandler<{ id: string }> = async (req, res) => {
  const mission = await getOpenMission(authenticatedUserId(res.locals.userId), req.params.id)
  res.status(200).json(mission)
}
