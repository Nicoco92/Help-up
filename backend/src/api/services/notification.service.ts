import type { Types } from 'mongoose';
import { Notification, type INotification } from '../../models/notification.model';
import { User } from '../../models/user.model';
import { findQuartier } from '../../constants/quartiers';
import type { NotificationType } from '../../constants/notifications';
import { NotFoundError } from '../utils/errors';
import { toObjectId } from '../utils/objectId';
import { missionEvents, type CreatedMission } from '../../models/events/missionEvents';

type NotificationRecord = INotification & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

// La mission concernée, en quelques mots
interface MissionRef {
    _id: Types.ObjectId;
    title: string;
}

// Une personne, telle qu'elle apparaît dans un message : « Bob N. »
interface PersonRef {
    firstName: string;
    lastName?: string;
}

export interface NotificationView {
    id: string;
    type: string;
    message: string;
    link: string;
    missionId: string | null;
    read: boolean;
    readAt: Date | null;
    createdAt: Date;
}

const MAX_LISTED = 50;
// Au-delà, une nouvelle mission ne prévient que les 100 premiers voisins (pas d'envoi massif)
const MAX_NEARBY = 100;

const toView = (n: NotificationRecord): NotificationView => ({
    id: n._id.toHexString(),
    type: n.type,
    message: n.message,
    link: n.link,
    missionId: n.missionId ? n.missionId.toHexString() : null,
    read: n.readAt !== null && n.readAt !== undefined,
    readAt: n.readAt ?? null,
    createdAt: n.createdAt
});

const shortName = (person: PersonRef): string =>
    person.lastName ? `${person.firstName} ${person.lastName.charAt(0)}.` : person.firstName;

const euros = (cents: number): string =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Envoi : une notification ne doit jamais faire échouer l'action qui la déclenche
// (postuler, accepter…) ; en cas de panne, on journalise et on continue
const send = async (
    userIds: Types.ObjectId[],
    type: NotificationType,
    message: string,
    link: string,
    mission?: MissionRef
): Promise<void> => {
    if (userIds.length === 0) {
        return;
    }
    try {
        await Notification.insertMany(
            userIds.map((userId) => ({ userId, type, message, link, missionId: mission?._id ?? null }))
        );
    } catch (err) {
        console.error(`Notification « ${type} » non envoyée :`, err);
    }
};

// Notification de l'utilisateur connecté, sinon 404 (celle d'un autre membre est traitée comme absente)
const findMine = async (userId: string, id: string): Promise<NotificationRecord> => {
    const notification = await Notification.findOne({
        _id: toObjectId(id, 'Identifiant de notification invalide'),
        userId: toObjectId(userId)
    }).lean<NotificationRecord>();
    if (!notification) {
        throw new NotFoundError('Notification introuvable');
    }
    return notification;
};

// --- Envois déclenchés par les autres services ---
export const notify = {
    // Mission publiée : les membres de la même ville qui ont la compétence demandée
    async missionNearby(mission: CreatedMission): Promise<void> {
        const quartier = findQuartier(mission.quartier);
        if (!quartier) {
            return;
        }
        // « Villejuif · Centre » → « Villejuif » ; « Le Kremlin-Bicêtre » reste tel quel
        const city = quartier.label.split(' · ')[0];
        const neighbours = await User.find({
            _id: { $ne: mission.ownerId },
            skills: mission.category,
            city: new RegExp(`^${escapeRegExp(city)}$`, 'i')
        })
            .select('_id')
            .limit(MAX_NEARBY)
            .lean<{ _id: Types.ObjectId }[]>();
        await send(
            neighbours.map((u) => u._id),
            'mission_nearby',
            `Nouvelle mission près de chez vous : « ${mission.title} » (${quartier.label}, ${euros(mission.rewardCents)}).`,
            `/missions/${mission._id.toHexString()}`,
            mission
        );
    },

    async applicationReceived(ownerId: Types.ObjectId, mission: MissionRef, applicant: PersonRef): Promise<void> {
        await send([ownerId], 'application_received', `${shortName(applicant)} a postulé à « ${mission.title} ».`, '/dashboard', mission);
    },

    async applicationAccepted(applicantId: Types.ObjectId, mission: MissionRef): Promise<void> {
        await send(
            [applicantId],
            'application_accepted',
            `Bonne nouvelle : votre candidature pour « ${mission.title} » est acceptée.`,
            '/dashboard',
            mission
        );
    },

    async applicationRejected(applicantIds: Types.ObjectId[], mission: MissionRef): Promise<void> {
        await send(
            applicantIds,
            'application_rejected',
            `Votre candidature pour « ${mission.title} » n’a pas été retenue.`,
            '/applications',
            mission
        );
    },

    async missionCompleted(providerId: Types.ObjectId, mission: MissionRef, owner: PersonRef): Promise<void> {
        await send(
            [providerId],
            'mission_completed',
            `« ${mission.title} » est terminée. Pensez à noter ${owner.firstName}.`,
            '/dashboard',
            mission
        );
    },

    async reviewReceived(targetId: Types.ObjectId, mission: MissionRef, author: PersonRef, rating: number): Promise<void> {
        await send(
            [targetId],
            'review_received',
            `${shortName(author)} vous a laissé un avis (${rating}/5) pour « ${mission.title} ».`,
            '/profile',
            mission
        );
    }
};

// Une mission créée, quel que soit le code qui la crée, prévient les voisins
missionEvents.on('created', (mission) => {
    void notify.missionNearby(mission).catch((err: unknown) => console.error('Notification de voisinage non envoyée :', err));
});

// --- API /api/notifications : les notifications de l'utilisateur connecté ---
export const notificationService = {
    // Les 50 plus récentes (ou seulement les non lues) et le nombre total de non lues
    async listMine(userId: string, unreadOnly: boolean): Promise<{ items: NotificationView[]; unreadCount: number }> {
        const me = toObjectId(userId);
        const [items, unreadCount] = await Promise.all([
            Notification.find(unreadOnly ? { userId: me, readAt: null } : { userId: me })
                .sort({ createdAt: -1 })
                .limit(MAX_LISTED)
                .lean<NotificationRecord[]>(),
            Notification.countDocuments({ userId: me, readAt: null })
        ]);
        return { items: items.map(toView), unreadCount };
    },

    async unreadCount(userId: string): Promise<number> {
        return Notification.countDocuments({ userId: toObjectId(userId), readAt: null });
    },

    async getMine(userId: string, id: string): Promise<NotificationView> {
        return toView(await findMine(userId, id));
    },

    // Marquer comme lue (read: true) ou non lue (read: false)
    async markMine(userId: string, id: string, read: boolean): Promise<NotificationView> {
        const notification = await findMine(userId, id);
        const updated = await Notification.findByIdAndUpdate(
            notification._id,
            { $set: { readAt: read ? (notification.readAt ?? new Date()) : null } },
            { returnDocument: 'after' }
        ).lean<NotificationRecord>();
        return toView(updated ?? notification);
    },

    async markAllRead(userId: string): Promise<number> {
        const result = await Notification.updateMany(
            { userId: toObjectId(userId), readAt: null },
            { $set: { readAt: new Date() } }
        );
        return result.modifiedCount;
    },

    async removeMine(userId: string, id: string): Promise<void> {
        const notification = await findMine(userId, id);
        await Notification.deleteOne({ _id: notification._id });
    }
};
