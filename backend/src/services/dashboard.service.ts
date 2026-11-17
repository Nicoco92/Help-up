import type { Types } from 'mongoose';
import { Mission, type IMission } from '../models/mission.model';
import { Application } from '../models/application.model';
import { User } from '../models/user.model';
import { BadRequestError } from '../utils/errors';
import { toObjectId } from '../utils/objectId';
import { findMyMission, toMissionSummary, type MissionSummary } from './application.service';

type MissionRecord = IMission & { _id: Types.ObjectId; createdAt: Date };
type UserRecord = { _id: Types.ObjectId; firstName: string; lastName?: string; city?: string; avatarUrl?: string };

// L'autre participant d'une mission : prénom, initiale du nom, ville
export interface PublicPerson {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
}

export interface DashboardMission extends MissionSummary {
    completedAt: Date | null;
    // Mon rôle dans la mission : je l'ai publiée (owner) ou je la réalise (provider)
    role: 'owner' | 'provider';
    pendingApplications: number;
    totalApplications: number;
    // Le prestataire retenu (pour mes missions) ou le client (pour les missions obtenues)
    counterpart: PublicPerson | null;
}

export interface Dashboard {
    stats: {
        openMissions: number;
        pendingApplications: number;
        obtainedMissions: number;
        completedMissions: number;
        earnedCents: number;
    };
    // Mes missions en cours (open, assigned), les plus proches d'abord
    published: DashboardMission[];
    // Les missions qui me sont attribuées et pas encore terminées
    obtained: DashboardMission[];
    // Les missions terminées, publiées ou réalisées, les plus récentes d'abord
    history: DashboardMission[];
}

const toPerson = (user: UserRecord): PublicPerson => ({
    id: user._id.toHexString(),
    firstName: user.firstName,
    lastName: user.lastName ? `${user.lastName.charAt(0)}.` : '',
    city: user.city,
    avatarUrl: user.avatarUrl
});

export const dashboardService = {
    async get(userId: string): Promise<Dashboard> {
        const me = toObjectId(userId);

        const [published, obtained, history] = await Promise.all([
            Mission.find({ ownerId: me, status: { $in: ['open', 'assigned'] } })
                .sort({ scheduledAt: 1 })
                .lean<MissionRecord[]>(),
            Mission.find({ providerId: me, status: 'assigned' })
                .sort({ scheduledAt: 1 })
                .lean<MissionRecord[]>(),
            Mission.find({ status: 'completed', $or: [{ ownerId: me }, { providerId: me }] })
                .sort({ completedAt: -1 })
                .lean<MissionRecord[]>()
        ]);

        // Nombre de candidatures par mission publiée et par statut, en une seule requête
        const counts = await Application.aggregate<{ _id: { missionId: Types.ObjectId; status: string }; n: number }>([
            { $match: { missionId: { $in: published.map((m) => m._id) } } },
            { $group: { _id: { missionId: '$missionId', status: '$status' }, n: { $sum: 1 } } }
        ]);
        const countsOf = (missionId: Types.ObjectId) => {
            const rows = counts.filter((c) => c._id.missionId.equals(missionId));
            return {
                pendingApplications: rows.find((c) => c._id.status === 'pending')?.n ?? 0,
                totalApplications: rows.reduce((sum, c) => sum + c.n, 0)
            };
        };

        // Les autres participants (prestataires de mes missions, clients des missions que je réalise)
        const all = [...published, ...obtained, ...history];
        const otherIds = all
            .map((m) => (m.ownerId.equals(me) ? m.providerId : m.ownerId))
            .filter((id): id is Types.ObjectId => Boolean(id));
        const users = await User.find({ _id: { $in: otherIds } })
            .select('firstName lastName city avatarUrl')
            .lean<UserRecord[]>();
        const usersById = new Map(users.map((u) => [u._id.toHexString(), u]));

        const toDashboardMission = (mission: MissionRecord): DashboardMission => {
            const role = mission.ownerId.equals(me) ? 'owner' : 'provider';
            const otherId = role === 'owner' ? mission.providerId : mission.ownerId;
            const other = otherId ? usersById.get(otherId.toHexString()) : undefined;
            return {
                ...toMissionSummary(mission),
                completedAt: mission.completedAt ?? null,
                role,
                ...(role === 'owner' && mission.status !== 'completed'
                    ? countsOf(mission._id)
                    : { pendingApplications: 0, totalApplications: 0 }),
                counterpart: other ? toPerson(other) : null
            };
        };

        const publishedView = published.map(toDashboardMission);
        const historyView = history.map(toDashboardMission);

        return {
            stats: {
                openMissions: published.filter((m) => m.status === 'open').length,
                pendingApplications: publishedView.reduce((sum, m) => sum + m.pendingApplications, 0),
                obtainedMissions: obtained.length,
                completedMissions: history.length,
                earnedCents: historyView
                    .filter((m) => m.role === 'provider')
                    .reduce((sum, m) => sum + m.rewardCents, 0)
            },
            published: publishedView,
            obtained: obtained.map(toDashboardMission),
            history: historyView
        };
    },

    // Clôturer une de mes missions : assigned → completed (seul le propriétaire peut le faire)
    async complete(ownerId: string, missionId: string): Promise<MissionSummary & { completedAt: Date | null }> {
        const mission = await findMyMission(ownerId, missionId);
        if (mission.status !== 'assigned') {
            throw new BadRequestError('Seule une mission attribuée peut être marquée comme terminée');
        }

        // Mise à jour conditionnelle : la mission ne peut être clôturée qu'une fois
        const completed = await Mission.findOneAndUpdate(
            { _id: mission._id, status: 'assigned' },
            { $set: { status: 'completed', completedAt: new Date() } },
            { returnDocument: 'after' }
        ).lean<MissionRecord>();
        if (!completed) {
            throw new BadRequestError('Seule une mission attribuée peut être marquée comme terminée');
        }
        return { ...toMissionSummary(completed), completedAt: completed.completedAt ?? null };
    }
};
