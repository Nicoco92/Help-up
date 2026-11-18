import type { Types } from 'mongoose';
import { Mission, type IMission } from '../../models/mission.model';
import { Message, type IMessage } from '../../models/message.model';
import { User } from '../../models/user.model';
import { ConflictError, NotFoundError } from '../utils/errors';
import { toObjectId } from '../utils/objectId';
import { PUBLIC_PERSON_FIELDS, toPublicPerson, type PublicPerson, type PublicPersonRecord } from '../utils/publicPerson';
import { toMissionSummary, type MissionSummary } from './application.service';
import { notify } from './notification.service';
import type { CreateMessageInput } from '../validators/message.validator';

// Messagerie privée : une conversation par mission attribuée, entre son client (ownerId)
// et son prestataire (providerId). L'identifiant d'une conversation est celui de sa mission.
// - Mission en cours (assigned) : lecture et écriture.
// - Mission terminée ou annulée : lecture seule (409 si on écrit).
// - Pas encore de prestataire, ou je ne suis pas participant : 404, comme une conversation absente.

type MissionRecord = IMission & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
type MessageRecord = IMessage & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

// Au premier chargement d'un fil, seulement les derniers messages (pas de réponse démesurée)
const MAX_MESSAGES = 200;

export interface MessageView {
    id: string;
    missionId: string;
    senderId: string;
    recipientId: string;
    body: string;
    // true = c'est moi qui l'ai envoyé (le front l'aligne à droite)
    mine: boolean;
    // Lu par son destinataire
    read: boolean;
    readAt: Date | null;
    createdAt: Date;
}

export interface ConversationView {
    // Identifiant de la conversation = identifiant de la mission
    id: string;
    mission: MissionSummary;
    // Mon rôle dans la mission : je l'ai publiée (owner) ou je la réalise (provider)
    role: 'owner' | 'provider';
    counterpart: PublicPerson | null;
    // false quand la mission n'est plus en cours : le fil reste lisible
    canWrite: boolean;
    lastMessage: MessageView | null;
    unreadCount: number;
}

const toView = (message: MessageRecord, me: Types.ObjectId): MessageView => ({
    id: message._id.toHexString(),
    missionId: message.missionId.toHexString(),
    senderId: message.senderId.toHexString(),
    recipientId: message.recipientId.toHexString(),
    body: message.body,
    mine: message.senderId.equals(me),
    read: message.readAt !== null && message.readAt !== undefined,
    readAt: message.readAt ?? null,
    createdAt: message.createdAt
});

// Missions où j'ai un interlocuteur : je suis client avec un prestataire retenu, ou je suis ce prestataire
const participantFilter = (me: Types.ObjectId) => ({
    providerId: { $ne: null },
    $or: [{ ownerId: me }, { providerId: me }]
});

// Conversation (= mission) dont je suis participant, sinon 404 (rien n'indique qu'elle existe)
const findConversation = async (me: Types.ObjectId, id: string): Promise<MissionRecord> => {
    const mission = await Mission.findOne({
        _id: toObjectId(id, 'Identifiant de conversation invalide'),
        ...participantFilter(me)
    }).lean<MissionRecord>();
    if (!mission) {
        throw new NotFoundError('Conversation introuvable');
    }
    return mission;
};

// L'autre participant de la mission
const otherParticipant = (mission: MissionRecord, me: Types.ObjectId): Types.ObjectId =>
    mission.ownerId.equals(me) ? (mission.providerId as Types.ObjectId) : mission.ownerId;

const toConversation = (
    mission: MissionRecord,
    me: Types.ObjectId,
    counterpart: PublicPersonRecord | undefined,
    lastMessage: MessageRecord | null,
    unreadCount: number
): ConversationView => ({
    id: mission._id.toHexString(),
    mission: toMissionSummary(mission),
    role: mission.ownerId.equals(me) ? 'owner' : 'provider',
    counterpart: counterpart ? toPublicPerson(counterpart) : null,
    canWrite: mission.status === 'assigned',
    lastMessage: lastMessage ? toView(lastMessage, me) : null,
    unreadCount
});

export const messageService = {
    // Mes conversations : la plus récemment active d'abord (dernier message, sinon date de la mission)
    async listConversations(userId: string): Promise<ConversationView[]> {
        const me = toObjectId(userId);
        const missions = await Mission.find(participantFilter(me)).lean<MissionRecord[]>();
        if (missions.length === 0) {
            return [];
        }

        // Dernier message et nombre de messages non lus par mission, en une seule requête
        const [stats, users] = await Promise.all([
            Message.aggregate<{ _id: Types.ObjectId; last: MessageRecord; unread: number }>([
                { $match: { missionId: { $in: missions.map((m) => m._id) } } },
                { $sort: { createdAt: -1, _id: -1 } },
                {
                    $group: {
                        _id: '$missionId',
                        last: { $first: '$$ROOT' },
                        unread: {
                            $sum: {
                                $cond: [{ $and: [{ $eq: ['$recipientId', me] }, { $eq: ['$readAt', null] }] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            User.find({ _id: { $in: missions.map((m) => otherParticipant(m, me)) } })
                .select(PUBLIC_PERSON_FIELDS)
                .lean<PublicPersonRecord[]>()
        ]);
        const statsByMission = new Map(stats.map((s) => [s._id.toHexString(), s]));
        const usersById = new Map(users.map((u) => [u._id.toHexString(), u]));

        const activity = (c: ConversationView, mission: MissionRecord): number =>
            new Date(c.lastMessage?.createdAt ?? mission.updatedAt).getTime();

        return missions
            .map((mission) => {
                const s = statsByMission.get(mission._id.toHexString());
                const conversation = toConversation(
                    mission,
                    me,
                    usersById.get(otherParticipant(mission, me).toHexString()),
                    s?.last ?? null,
                    s?.unread ?? 0
                );
                return { conversation, at: activity(conversation, mission) };
            })
            .sort((a, b) => b.at - a.at)
            .map(({ conversation }) => conversation);
    },

    // En-tête d'une conversation : la mission, l'autre participant, peut-on encore écrire
    async getConversation(userId: string, id: string): Promise<ConversationView> {
        const me = toObjectId(userId);
        const mission = await findConversation(me, id);
        const [counterpart, last, unread] = await Promise.all([
            User.findById(otherParticipant(mission, me)).select(PUBLIC_PERSON_FIELDS).lean<PublicPersonRecord>(),
            Message.findOne({ missionId: mission._id }).sort({ createdAt: -1, _id: -1 }).lean<MessageRecord>(),
            Message.countDocuments({ missionId: mission._id, recipientId: me, readAt: null })
        ]);
        return toConversation(mission, me, counterpart ?? undefined, last, unread);
    },

    // Messages du fil, du plus ancien au plus récent. Les messages qui me sont adressés passent « lus ».
    // after = id du dernier message déjà affiché : seulement les nouveaux
    async listMessages(userId: string, id: string, after?: string): Promise<MessageView[]> {
        const me = toObjectId(userId);
        const mission = await findConversation(me, id);

        await Message.updateMany(
            { missionId: mission._id, recipientId: me, readAt: null },
            { $set: { readAt: new Date() } }
        );

        // Les ObjectId croissent avec le temps : _id > after = messages postérieurs
        const filter = after
            ? { missionId: mission._id, _id: { $gt: toObjectId(after, 'Identifiant de message invalide') } }
            : { missionId: mission._id };
        const messages = await Message.find(filter)
            .sort({ _id: -1 })
            .limit(MAX_MESSAGES)
            .lean<MessageRecord[]>();
        return messages.reverse().map((m) => toView(m, me));
    },

    // Écrire à l'autre participant, tant que la mission est en cours
    async send(userId: string, id: string, input: CreateMessageInput): Promise<MessageView> {
        const me = toObjectId(userId);
        const mission = await findConversation(me, id);
        if (mission.status !== 'assigned') {
            throw new ConflictError('La mission n’est plus en cours : cette conversation est en lecture seule', 'CONFLICT');
        }
        const recipientId = otherParticipant(mission, me);

        // Une seule notification tant que le destinataire n'a pas lu : pas une par message
        const alreadyWaiting = await Message.exists({ missionId: mission._id, senderId: me, recipientId, readAt: null });

        const created = await Message.create({ missionId: mission._id, senderId: me, recipientId, body: input.body });

        if (!alreadyWaiting) {
            const sender = await User.findById(me).select('firstName lastName').lean<PublicPersonRecord>();
            if (sender) {
                await notify.messageReceived(recipientId, mission, sender);
            }
        }
        return toView(created.toObject() as MessageRecord, me);
    },

    // Pastille « Messages » de la barre de navigation
    async unreadCount(userId: string): Promise<number> {
        return Message.countDocuments({ recipientId: toObjectId(userId), readAt: null });
    }
};
