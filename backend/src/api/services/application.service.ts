import type { Types } from 'mongoose';
import { Mission, type IMission } from '../models/mission.model';
import { Application, type IApplication } from '../models/application.model';
import { User } from '../models/user.model';
import { CATEGORIES } from '../constants/categories';
import { findQuartier } from '../constants/quartiers';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { toObjectId } from '../utils/objectId';
import { notify } from './notification.service';
import type { CreateApplicationInput, UpdateApplicationInput } from '../validators/application.validator';

// Documents lus avec .lean() : objets simples, avec leur _id
type MissionRecord = IMission & { _id: Types.ObjectId; createdAt: Date };
type ApplicationRecord = IApplication & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
type UserRecord = {
    _id: Types.ObjectId;
    firstName: string;
    lastName?: string;
    city?: string;
    avatarUrl?: string;
    skills?: string[];
};

// Ce que l'API renvoie d'une mission dans une candidature
export interface MissionSummary {
    id: string;
    ownerId: string;
    providerId: string | null;
    title: string;
    status: string;
    rewardCents: number;
    estimatedMinutes: number;
    category: string;
    categoryLabel: string;
    quartier: string;
    quartierLabel: string;
    scheduledAt: Date;
    urgent: boolean;
}

// Ce que le propriétaire d'une mission voit d'un candidat : ni email ni téléphone, nom réduit à l'initiale
export interface PublicApplicant {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
    skills: string[];
}

export interface ApplicationView {
    id: string;
    missionId: string;
    applicantId: string;
    message: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    mission?: MissionSummary | null;
    applicant?: PublicApplicant | null;
}

export const toMissionSummary = (mission: MissionRecord): MissionSummary => ({
    id: mission._id.toHexString(),
    ownerId: mission.ownerId.toHexString(),
    providerId: mission.providerId ? mission.providerId.toHexString() : null,
    title: mission.title,
    status: mission.status,
    rewardCents: mission.rewardCents,
    estimatedMinutes: mission.estimatedMinutes,
    category: mission.category,
    categoryLabel: CATEGORIES.find((c) => c.slug === mission.category)?.label ?? mission.category,
    quartier: mission.quartier,
    quartierLabel: findQuartier(mission.quartier)?.label ?? mission.quartier,
    scheduledAt: mission.scheduledAt,
    urgent: mission.urgent ?? false
});

const toPublicApplicant = (user: UserRecord): PublicApplicant => ({
    id: user._id.toHexString(),
    firstName: user.firstName,
    lastName: user.lastName ? `${user.lastName.charAt(0)}.` : '',
    city: user.city,
    avatarUrl: user.avatarUrl,
    skills: user.skills ?? []
});

const toView = (application: ApplicationRecord): ApplicationView => ({
    id: application._id.toHexString(),
    missionId: application.missionId.toHexString(),
    applicantId: application.applicantId.toHexString(),
    message: application.message,
    status: application.status,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt
});

// Candidature de l'utilisateur connecté, sinon 404 (celle d'un autre membre est traitée comme absente)
const findMyApplication = async (userId: string, id: string): Promise<ApplicationRecord> => {
    const application = await Application.findOne({
        _id: toObjectId(id, 'Identifiant de candidature invalide'),
        applicantId: toObjectId(userId)
    }).lean<ApplicationRecord>();
    if (!application) {
        throw new NotFoundError('Candidature introuvable');
    }
    return application;
};

// Mission publiée par l'utilisateur connecté, sinon 404
export const findMyMission = async (ownerId: string, missionId: string): Promise<MissionRecord> => {
    const mission = await Mission.findOne({
        _id: toObjectId(missionId, 'Identifiant de mission invalide'),
        ownerId: toObjectId(ownerId)
    }).lean<MissionRecord>();
    if (!mission) {
        throw new NotFoundError('Mission introuvable');
    }
    return mission;
};

// Candidature rattachée à une mission donnée, sinon 404
const findMissionApplication = async (missionId: Types.ObjectId, id: string): Promise<ApplicationRecord> => {
    const application = await Application.findOne({
        _id: toObjectId(id, 'Identifiant de candidature invalide'),
        missionId
    }).lean<ApplicationRecord>();
    if (!application) {
        throw new NotFoundError('Candidature introuvable');
    }
    return application;
};

const withMission = async (application: ApplicationRecord): Promise<ApplicationView> => {
    const mission = await Mission.findById(application.missionId).lean<MissionRecord>();
    return { ...toView(application), mission: mission ? toMissionSummary(mission) : null };
};

export const applicationService = {
    // Postuler : mission existante, ouverte, pas la sienne, une seule fois
    async create(userId: string, input: CreateApplicationInput): Promise<ApplicationView> {
        const applicantId = toObjectId(userId);
        const mission = await Mission.findById(toObjectId(input.missionId)).lean<MissionRecord>();
        if (!mission) {
            throw new NotFoundError('Mission introuvable');
        }
        if (mission.ownerId.equals(applicantId)) {
            throw new BadRequestError('Vous ne pouvez pas postuler à votre propre mission');
        }
        if (mission.status !== 'open') {
            throw new BadRequestError('Cette mission n’accepte plus de candidatures');
        }
        if (await Application.exists({ missionId: mission._id, applicantId })) {
            throw new ConflictError('Vous avez déjà postulé à cette mission', 'CONFLICT');
        }

        // Deux requêtes simultanées : l'index unique missionId + applicantId renvoie un 409 CONFLICT
        const created = await Application.create({ missionId: mission._id, applicantId, message: input.message });

        const applicant = await User.findById(applicantId).select('firstName lastName').lean<UserRecord>();
        if (applicant) {
            await notify.applicationReceived(mission.ownerId, mission, applicant);
        }
        return { ...toView(created.toObject() as ApplicationRecord), mission: toMissionSummary(mission) };
    },

    // Mes candidatures, les plus récentes d'abord, avec le résumé de chaque mission
    async listMine(userId: string): Promise<ApplicationView[]> {
        const applications = await Application.find({ applicantId: toObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean<ApplicationRecord[]>();
        const missions = await Mission.find({ _id: { $in: applications.map((a) => a.missionId) } })
            .lean<MissionRecord[]>();
        const byId = new Map(missions.map((m) => [m._id.toHexString(), m]));

        return applications.map((application) => {
            const mission = byId.get(application.missionId.toHexString());
            return { ...toView(application), mission: mission ? toMissionSummary(mission) : null };
        });
    },

    async getMine(userId: string, id: string): Promise<ApplicationView> {
        return withMission(await findMyApplication(userId, id));
    },

    // Modifier son message, tant que la candidature est en attente
    async updateMine(userId: string, id: string, input: UpdateApplicationInput): Promise<ApplicationView> {
        const application = await findMyApplication(userId, id);
        if (application.status !== 'pending') {
            throw new BadRequestError('Cette candidature a déjà été traitée');
        }
        const updated = await Application.findByIdAndUpdate(
            application._id,
            { $set: { message: input.message } },
            { returnDocument: 'after', runValidators: true }
        ).lean<ApplicationRecord>();
        return withMission(updated ?? application);
    },

    // Retirer sa candidature, tant qu'elle est en attente (on peut ensuite postuler à nouveau)
    async removeMine(userId: string, id: string): Promise<void> {
        const application = await findMyApplication(userId, id);
        if (application.status !== 'pending') {
            throw new BadRequestError('Seule une candidature en attente peut être retirée');
        }
        await Application.deleteOne({ _id: application._id });
    },

    // Candidats d'une de mes missions, avec leur profil public
    async listForMission(ownerId: string, missionId: string): Promise<ApplicationView[]> {
        const mission = await findMyMission(ownerId, missionId);
        const applications = await Application.find({ missionId: mission._id })
            .sort({ createdAt: 1 })
            .lean<ApplicationRecord[]>();
        const users = await User.find({ _id: { $in: applications.map((a) => a.applicantId) } })
            .select('firstName lastName city avatarUrl skills')
            .lean<UserRecord[]>();
        const byId = new Map(users.map((u) => [u._id.toHexString(), u]));

        return applications.map((application) => {
            const user = byId.get(application.applicantId.toHexString());
            return { ...toView(application), applicant: user ? toPublicApplicant(user) : null };
        });
    },

    // Accepter : la mission passe « assigned » avec ce prestataire, les autres candidatures en attente sont refusées
    async accept(ownerId: string, missionId: string, id: string): Promise<ApplicationView> {
        const mission = await findMyMission(ownerId, missionId);
        const application = await findMissionApplication(mission._id, id);
        if (application.status !== 'pending') {
            throw new BadRequestError('Cette candidature a déjà été traitée');
        }

        // Mise à jour conditionnelle : si deux acceptations arrivent en même temps, une seule réussit
        const assigned = await Mission.findOneAndUpdate(
            { _id: mission._id, status: 'open' },
            { $set: { status: 'assigned', providerId: application.applicantId } },
            { returnDocument: 'after' }
        ).lean<MissionRecord>();
        if (!assigned) {
            throw new BadRequestError('Cette mission n’est plus ouverte');
        }

        await Application.updateOne({ _id: application._id }, { $set: { status: 'accepted' } });
        const others = { missionId: mission._id, _id: { $ne: application._id }, status: 'pending' as const };
        const rejected = await Application.find(others).select('applicantId').lean<ApplicationRecord[]>();
        await Application.updateMany(others, { $set: { status: 'rejected' } });

        await notify.applicationAccepted(application.applicantId, assigned);
        await notify.applicationRejected(rejected.map((a) => a.applicantId), assigned);

        return { ...toView({ ...application, status: 'accepted' }), mission: toMissionSummary(assigned) };
    },

    // Refuser une candidature en attente : la mission reste ouverte
    async reject(ownerId: string, missionId: string, id: string): Promise<ApplicationView> {
        const mission = await findMyMission(ownerId, missionId);
        const application = await findMissionApplication(mission._id, id);
        if (application.status !== 'pending') {
            throw new BadRequestError('Cette candidature a déjà été traitée');
        }

        await Application.updateOne({ _id: application._id }, { $set: { status: 'rejected' } });
        await notify.applicationRejected([application.applicantId], mission);
        return { ...toView({ ...application, status: 'rejected' }), mission: toMissionSummary(mission) };
    }
};
