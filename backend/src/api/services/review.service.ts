import type { Types } from 'mongoose';
import { Mission, type IMission } from '../../models/mission.model';
import { Review, type IReview } from '../../models/review.model';
import { User } from '../../models/user.model';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { toObjectId } from '../utils/objectId';
import { PUBLIC_PERSON_FIELDS, toPublicPerson, type PublicPerson, type PublicPersonRecord } from '../utils/publicPerson';
import { notify } from './notification.service';
import type { CreateReviewInput, UpdateReviewInput } from '../validators/review.validator';

// Documents lus avec .lean() : objets simples, avec leur _id
type MissionRecord = IMission & { _id: Types.ObjectId };
type ReviewRecord = IReview & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

// La mission notée, en quelques mots
export interface ReviewedMission {
    id: string;
    title: string;
    category: string;
}

export interface ReviewView {
    id: string;
    missionId: string;
    authorId: string;
    targetId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    mission?: ReviewedMission | null;
    // Mes avis : la personne notée ; avis reçus par un membre : leur auteur
    target?: PublicPerson | null;
    author?: PublicPerson | null;
}

// Note moyenne d'un membre, calculée à la volée (jamais stockée)
export interface RatingSummary {
    average: number | null;
    count: number;
}

const toView = (review: ReviewRecord): ReviewView => ({
    id: review._id.toHexString(),
    missionId: review.missionId.toHexString(),
    authorId: review.authorId.toHexString(),
    targetId: review.targetId.toHexString(),
    rating: review.rating,
    comment: review.comment ?? '',
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
});

const toReviewedMission = (mission: MissionRecord): ReviewedMission => ({
    id: mission._id.toHexString(),
    title: mission.title,
    category: mission.category
});

// Complète une liste d'avis avec la mission et une personne (la cible ou l'auteur), en deux requêtes
const enrich = async (reviews: ReviewRecord[], person: 'target' | 'author'): Promise<ReviewView[]> => {
    const personIds = reviews.map((r) => (person === 'target' ? r.targetId : r.authorId));
    const [missions, users] = await Promise.all([
        Mission.find({ _id: { $in: reviews.map((r) => r.missionId) } })
            .select('title category')
            .lean<MissionRecord[]>(),
        User.find({ _id: { $in: personIds } })
            .select(PUBLIC_PERSON_FIELDS)
            .lean<PublicPersonRecord[]>()
    ]);
    const missionsById = new Map(missions.map((m) => [m._id.toHexString(), m]));
    const usersById = new Map(users.map((u) => [u._id.toHexString(), u]));

    return reviews.map((review) => {
        const mission = missionsById.get(review.missionId.toHexString());
        const user = usersById.get((person === 'target' ? review.targetId : review.authorId).toHexString());
        return {
            ...toView(review),
            mission: mission ? toReviewedMission(mission) : null,
            [person]: user ? toPublicPerson(user) : null
        };
    });
};

// Avis écrit par l'utilisateur connecté, sinon 404 (celui d'un autre membre est traité comme absent)
const findMyReview = async (authorId: string, id: string): Promise<ReviewRecord> => {
    const review = await Review.findOne({
        _id: toObjectId(id, 'Identifiant d’avis invalide'),
        authorId: toObjectId(authorId)
    }).lean<ReviewRecord>();
    if (!review) {
        throw new NotFoundError('Avis introuvable');
    }
    return review;
};

export const reviewService = {
    // Noter l'autre participant d'une mission terminée, une seule fois
    async create(authorId: string, input: CreateReviewInput): Promise<ReviewView> {
        const me = toObjectId(authorId);
        // Une mission dont je ne suis ni le client ni le prestataire est traitée comme absente
        const mission = await Mission.findOne({
            _id: toObjectId(input.missionId, 'Identifiant de mission invalide'),
            $or: [{ ownerId: me }, { providerId: me }]
        }).lean<MissionRecord>();
        if (!mission) {
            throw new NotFoundError('Mission introuvable');
        }
        if (mission.status !== 'completed' || !mission.providerId) {
            throw new BadRequestError('Une mission ne peut être notée qu’une fois terminée');
        }
        if (await Review.exists({ missionId: mission._id, authorId: me })) {
            throw new ConflictError('Vous avez déjà noté cette mission', 'CONFLICT');
        }

        // La cible n'est jamais envoyée par le client : c'est l'autre participant de la mission
        const targetId = mission.ownerId.equals(me) ? mission.providerId : mission.ownerId;

        // Deux requêtes simultanées : l'index unique missionId + authorId renvoie un 409 CONFLICT
        const created = await Review.create({
            missionId: mission._id,
            authorId: me,
            targetId,
            rating: input.rating,
            comment: input.comment ?? ''
        });
        const author = await User.findById(me).select('firstName lastName').lean<PublicPersonRecord>();
        if (author) {
            await notify.reviewReceived(targetId, mission, author, input.rating);
        }

        const [view] = await enrich([created.toObject() as ReviewRecord], 'target');
        return view;
    },

    // Les avis que j'ai écrits, les plus récents d'abord
    async listMine(authorId: string): Promise<ReviewView[]> {
        const reviews = await Review.find({ authorId: toObjectId(authorId) })
            .sort({ createdAt: -1 })
            .lean<ReviewRecord[]>();
        return enrich(reviews, 'target');
    },

    async getMine(authorId: string, id: string): Promise<ReviewView> {
        const [view] = await enrich([await findMyReview(authorId, id)], 'target');
        return view;
    },

    async updateMine(authorId: string, id: string, input: UpdateReviewInput): Promise<ReviewView> {
        const review = await findMyReview(authorId, id);
        const updated = await Review.findByIdAndUpdate(
            review._id,
            { $set: input },
            { returnDocument: 'after', runValidators: true }
        ).lean<ReviewRecord>();
        const [view] = await enrich([updated ?? review], 'target');
        return view;
    },

    async removeMine(authorId: string, id: string): Promise<void> {
        const review = await findMyReview(authorId, id);
        await Review.deleteOne({ _id: review._id });
    },

    // Avis reçus par un membre (visibles par tous les membres connectés) et sa note moyenne
    async listForUser(userId: string): Promise<{ items: ReviewView[]; summary: RatingSummary }> {
        const targetId = toObjectId(userId, 'Identifiant de membre invalide');
        if (!(await User.exists({ _id: targetId }))) {
            throw new NotFoundError('Membre introuvable');
        }

        const [reviews, stats] = await Promise.all([
            Review.find({ targetId }).sort({ createdAt: -1 }).limit(50).lean<ReviewRecord[]>(),
            Review.aggregate<{ average: number; count: number }>([
                { $match: { targetId } },
                { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
            ])
        ]);

        return {
            items: await enrich(reviews, 'author'),
            summary: {
                // Arrondie au dixième : 4,25 → 4,3
                average: stats[0] ? Math.round(stats[0].average * 10) / 10 : null,
                count: stats[0]?.count ?? 0
            }
        };
    }
};
