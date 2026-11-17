import { Types } from 'mongoose'
import { User, type IUserDocument } from '../../models/user.model'
import { Mission } from '../../models/mission.model'
import { Application } from '../../models/application.model'
import { Notification } from '../../models/notification.model'
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors'
import type { UpdateProfileInput } from '../validators/user.validator'
import type { UserRole } from '../../constants/roles'

type PrivateUser = ReturnType<IUserDocument['toJSON']>

// Ce qu'un membre voit d'un autre membre : ni email, ni téléphone, nom de famille réduit à l'initiale.
export interface PublicUserProfile {
  id: string
  firstName: string
  lastName: string
  city?: string
  bio?: string
  skills: string[]
  avatarUrl?: string
  createdAt: Date
}

function toPublicProfile(user: IUserDocument): PublicUserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName ? `${user.lastName.charAt(0)}.` : '',
    city: user.city,
    bio: user.bio,
    skills: user.skills,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}

function assertObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Identifiant utilisateur invalide')
  }
}

async function findUserOr404(id: string): Promise<IUserDocument> {
  const user = await User.findById(id)
  if (!user) {
    throw new NotFoundError('Utilisateur introuvable')
  }
  return user
}

// Supprime un compte et ce qui n'a plus de sens sans lui. Refusé tant qu'une mission est en cours
// (assigned), comme propriétaire ou comme prestataire : l'autre membre attend quelque chose.
// Les missions terminées ou annulées restent pour l'historique de l'autre participant.
async function deleteAccount(userId: string): Promise<void> {
  const busy = await Mission.exists({
    status: 'assigned',
    $or: [{ ownerId: userId }, { providerId: userId }],
  })
  if (busy) {
    throw new ConflictError(
      'Termine ou annule tes missions en cours avant de supprimer le compte',
      'CONFLICT',
    )
  }

  const openMissionIds = await Mission.find({ ownerId: userId, status: 'open' }).distinct('_id')
  await Application.deleteMany({ missionId: { $in: openMissionIds } })
  await Mission.deleteMany({ _id: { $in: openMissionIds } })
  await Application.updateMany({ applicantId: userId, status: 'pending' }, { status: 'withdrawn' })
  // Ses notifications, et celles des autres membres qui pointent vers ses missions supprimées
  await Notification.deleteMany({ $or: [{ userId }, { missionId: { $in: openMissionIds } }] })
  await User.deleteOne({ _id: userId })
}

export class UserService {
  async getMe(userId: string): Promise<PrivateUser> {
    return (await findUserOr404(userId)).toJSON()
  }

  async updateMe(userId: string, data: UpdateProfileInput): Promise<PrivateUser> {
    const user = await findUserOr404(userId)

    if (data.firstName !== undefined) user.firstName = data.firstName
    if (data.lastName !== undefined) user.lastName = data.lastName
    if (data.skills !== undefined) user.skills = data.skills
    // Champs facultatifs : une chaîne vide efface la valeur.
    if (data.phone !== undefined) user.phone = data.phone || undefined
    if (data.city !== undefined) user.city = data.city || undefined
    if (data.bio !== undefined) user.bio = data.bio || undefined
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl || undefined

    await user.save()
    return user.toJSON()
  }

  async deleteMe(userId: string): Promise<void> {
    await findUserOr404(userId)
    await deleteAccount(userId)
  }

  async deleteUser(targetId: string, requestingUser: IUserDocument): Promise<void> {
    assertObjectId(targetId)
    // Un admin supprime son propre compte par DELETE /api/users/me, en connaissance de cause.
    if (targetId === requestingUser.id) {
      throw new BadRequestError('Utilise la suppression de ton propre compte depuis ton profil')
    }
    await findUserOr404(targetId)
    await deleteAccount(targetId)
  }

  async getUserById(
    targetId: string,
    requestingUser: IUserDocument,
  ): Promise<PrivateUser | PublicUserProfile> {
    assertObjectId(targetId)
    const user = await findUserOr404(targetId)

    if (requestingUser.id === user.id || requestingUser.role === 'admin') {
      return user.toJSON()
    }
    // Les comptes administrateurs n'apparaissent pas dans l'annuaire : même réponse qu'un compte absent.
    if (user.role === 'admin') {
      throw new NotFoundError('Utilisateur introuvable')
    }
    return toPublicProfile(user)
  }

  async listUsers(requestingUser: IUserDocument): Promise<Array<PrivateUser | PublicUserProfile>> {
    if (requestingUser.role === 'admin') {
      const users = await User.find().sort({ createdAt: -1 })
      return users.map((u) => u.toJSON())
    }
    // « Tout sauf admin » plutôt que « role = client » : les comptes créés par les scripts mongosh
    // (seed-demo.js) n'ont pas de champ role et doivent quand même apparaître.
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 })
    return users.map(toPublicProfile)
  }

  async updateUserRole(
    targetId: string,
    role: UserRole,
    requestingUser: IUserDocument,
  ): Promise<PrivateUser> {
    assertObjectId(targetId)
    // Empêche un admin de se rétrograder lui-même (et de laisser la plateforme sans admin).
    if (targetId === requestingUser.id) {
      throw new BadRequestError('Tu ne peux pas modifier ton propre rôle')
    }
    const user = await findUserOr404(targetId)
    user.role = role
    await user.save()
    return user.toJSON()
  }
}

export const userService = new UserService()
