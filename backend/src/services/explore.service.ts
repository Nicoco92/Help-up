import mongoose, { Types } from 'mongoose'
import type { Filter, Sort } from 'mongodb'
import { CATEGORIES } from '../constants/categories'
import { findQuartier } from '../constants/quartiers'
import type { ExploreQuery } from '../validators/explore.validator'
import { BadRequestError, NotFoundError } from '../utils/errors'

type MissionRecord = {
  _id: Types.ObjectId
  ownerId: Types.ObjectId
  providerId?: Types.ObjectId | null
  title: string
  description: string
  rewardCents: number
  estimatedMinutes: number
  category: string
  scheduledAt: Date
  quartier: string
  location: { type: 'Point'; coordinates: [number, number] }
  status: 'open' | 'assigned' | 'completed' | 'cancelled'
  urgent?: boolean
  createdAt: Date
  updatedAt?: Date
}

type UserRecord = {
  _id: Types.ObjectId
  firstName?: string
  city?: string
  avatarUrl?: string
}

type PublicOwner = {
  id: string
  firstName: string
  city?: string
  avatarUrl?: string
}

export type PublicMission = Omit<MissionRecord, '_id' | 'ownerId' | 'providerId'> & {
  id: string
  ownerId: string
  providerId: string | null
  categoryLabel: string
  quartierLabel: string
  owner: PublicOwner | null
  alreadyApplied?: boolean
}

function publicMission(
  mission: MissionRecord,
  owner: UserRecord | null,
  alreadyApplied?: boolean,
): PublicMission {
  const { _id, ownerId, providerId, ...fields } = mission
  return {
    ...fields,
    id: _id.toHexString(),
    ownerId: ownerId.toHexString(),
    providerId: providerId?.toHexString() ?? null,
    categoryLabel: CATEGORIES.find((category) => category.slug === mission.category)?.label ?? mission.category,
    quartierLabel: findQuartier(mission.quartier)?.label ?? mission.quartier,
    owner: owner
      ? {
          id: owner._id.toHexString(),
          firstName: owner.firstName ?? 'Membre HelpUP',
          ...(owner.city ? { city: owner.city } : {}),
          ...(owner.avatarUrl ? { avatarUrl: owner.avatarUrl } : {}),
        }
      : null,
    ...(alreadyApplied === undefined ? {} : { alreadyApplied }),
  }
}

function sortFor(sort: ExploreQuery['sort']): Sort {
  switch (sort) {
    case 'date_asc':
      return { urgent: -1, scheduledAt: 1 }
    case 'reward_asc':
      return { urgent: -1, rewardCents: 1, scheduledAt: -1 }
    case 'reward_desc':
      return { urgent: -1, rewardCents: -1, scheduledAt: -1 }
    case 'date_desc':
    default:
      return { urgent: -1, scheduledAt: -1 }
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function objectId(id: string): Types.ObjectId {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new BadRequestError('Identifiant de mission invalide.')
  }
  return new Types.ObjectId(id)
}

async function findOwners(missions: MissionRecord[]) {
  const ownerIds = [...new Map(missions.map((mission) => [mission.ownerId.toHexString(), mission.ownerId])).values()]
  if (ownerIds.length === 0) {
    return new Map<string, UserRecord>()
  }

  const owners = await mongoose.connection
    .collection<UserRecord>('users')
    .find({ _id: { $in: ownerIds } }, { projection: { firstName: 1, city: 1, avatarUrl: 1 } })
    .toArray()

  return new Map(owners.map((owner) => [owner._id.toHexString(), owner]))
}

export async function searchOpenMissions(userId: string, query: ExploreQuery): Promise<PublicMission[]> {
  const userObjectId = objectId(userId)
  const reward: { $gte?: number; $lte?: number } = {}
  if (query.minReward !== undefined) reward.$gte = query.minReward
  if (query.maxReward !== undefined) reward.$lte = query.maxReward

  const filter: Filter<MissionRecord> = {
    status: 'open',
    ownerId: { $ne: userObjectId },
    ...(query.q
      ? {
          $or: [
            { title: { $regex: escapeRegex(query.q), $options: 'i' } },
            { description: { $regex: escapeRegex(query.q), $options: 'i' } },
          ],
        }
      : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(Object.keys(reward).length ? { rewardCents: reward } : {}),
  }

  const missions = await mongoose.connection
    .collection<MissionRecord>('missions')
    .find(filter)
    .sort(sortFor(query.sort))
    .limit(100)
    .toArray()

  const owners = await findOwners(missions)
  return missions.map((mission) => publicMission(mission, owners.get(mission.ownerId.toHexString()) ?? null))
}

export async function getOpenMission(userId: string, missionId: string): Promise<PublicMission> {
  const userObjectId = objectId(userId)
  const missionObjectId = objectId(missionId)
  const mission = await mongoose.connection.collection<MissionRecord>('missions').findOne({
    _id: missionObjectId,
    status: 'open',
    ownerId: { $ne: userObjectId },
  })

  if (!mission) {
    throw new NotFoundError('Mission introuvable.')
  }

  const [owner, application] = await Promise.all([
    mongoose.connection.collection<UserRecord>('users').findOne(
      { _id: mission.ownerId },
      { projection: { firstName: 1, city: 1, avatarUrl: 1 } },
    ),
    mongoose.connection.collection('applications').findOne(
      { missionId: missionObjectId, applicantId: userObjectId },
      { projection: { _id: 1 } },
    ),
  ])

  return publicMission(mission, owner, application !== null)
}
