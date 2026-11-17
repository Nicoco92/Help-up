import type { Types } from 'mongoose'
import { Mission } from '../../models/mission.model'
import { Application } from '../../models/application.model'
import { Notification } from '../../models/notification.model'
import { findQuartier, type QuartierSlug } from '../../constants/quartiers'
import { ConflictError, NotFoundError } from '../utils/errors'
import { toObjectId } from '../utils/objectId'
import type { CreateMissionInput, ListMissionsQuery, UpdateMissionInput } from '../validators/mission.validator'

type MissionJSON = ReturnType<InstanceType<typeof Mission>['toJSON']>

// Le client choisit un quartier, le serveur en déduit les coordonnées : impossible d'en envoyer de fausses.
function locationOf(quartier: QuartierSlug): { type: 'Point'; coordinates: [number, number] } {
  const found = findQuartier(quartier)
  if (!found) throw new NotFoundError('Quartier introuvable') // inatteignable : zod a validé le slug
  const [lng, lat] = found.coordinates
  return { type: 'Point', coordinates: [lng, lat] }
}

function missionId(id: string): Types.ObjectId {
  return toObjectId(id, 'Identifiant de mission invalide')
}

// La mission d'un autre membre et une mission absente donnent la même réponse (contrat du livret).
const notFound = () => new NotFoundError('Mission introuvable')
const notOpen = (action: string) =>
  new ConflictError(`Seule une mission ouverte peut être ${action}`, 'CONFLICT')

export class MissionService {
  async list(ownerId: string, query: ListMissionsQuery): Promise<MissionJSON[]> {
    const filter = query.status ? { ownerId, status: query.status } : { ownerId }
    const missions = await Mission.find(filter).sort({ createdAt: -1 })
    return missions.map((m) => m.toJSON())
  }

  async create(ownerId: string, data: CreateMissionInput): Promise<MissionJSON> {
    // ownerId vient du JWT ; status, providerId et completedAt prennent leur valeur par défaut.
    const mission = await Mission.create({ ...data, ownerId, location: locationOf(data.quartier) })
    return mission.toJSON()
  }

  async get(ownerId: string, id: string): Promise<MissionJSON> {
    const mission = await Mission.findOne({ _id: missionId(id), ownerId })
    if (!mission) throw notFound()
    return mission.toJSON()
  }

  async update(ownerId: string, id: string, data: UpdateMissionInput): Promise<MissionJSON> {
    const _id = missionId(id)
    const changes = data.quartier ? { ...data, location: locationOf(data.quartier) } : data

    // Condition « status: open » dans la requête elle-même : pas de fenêtre entre la vérification
    // et l'écriture, même si une candidature est acceptée au même moment.
    const mission = await Mission.findOneAndUpdate(
      { _id, ownerId, status: 'open' },
      { $set: changes },
      { returnDocument: 'after', runValidators: true },
    )
    if (mission) return mission.toJSON()

    throw (await Mission.exists({ _id, ownerId })) ? notOpen('modifiée') : notFound()
  }

  // Modération : un administrateur supprime la mission de n'importe quel membre, quel que soit son statut.
  // (Un membre ne supprime pas ses missions, il les masque avec PATCH { hidden: true }.)
  async removeAsAdmin(id: string): Promise<void> {
    const _id = missionId(id)
    const mission = await Mission.findByIdAndDelete(_id)
    if (!mission) throw notFound()
    // Les candidatures et notifications d'une mission supprimée n'ont plus de sens.
    await Application.deleteMany({ missionId: _id })
    await Notification.deleteMany({ missionId: _id })
  }
}

export const missionService = new MissionService()
