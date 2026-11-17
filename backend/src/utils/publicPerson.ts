import type { Types } from 'mongoose';

// Ce qu'un membre voit d'un autre : prénom, initiale du nom, ville (ni email ni téléphone)
export interface PublicPerson {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
}

// Champs à lire en base pour construire un PublicPerson
export const PUBLIC_PERSON_FIELDS = 'firstName lastName city avatarUrl';

export type PublicPersonRecord = {
    _id: Types.ObjectId;
    firstName: string;
    lastName?: string;
    city?: string;
    avatarUrl?: string;
};

export const toPublicPerson = (user: PublicPersonRecord): PublicPerson => ({
    id: user._id.toHexString(),
    firstName: user.firstName,
    lastName: user.lastName ? `${user.lastName.charAt(0)}.` : '',
    city: user.city,
    avatarUrl: user.avatarUrl
});
