import type { PublicPerson } from './dashboard';

// Avis laissé après une mission terminée (note de 1 à 5, commentaire facultatif)
export interface Review {
    id: string;
    missionId: string;
    authorId: string;
    targetId: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    mission?: { id: string; title: string; category: string } | null;
    // Mes avis : la personne notée ; avis reçus : leur auteur
    target?: PublicPerson | null;
    author?: PublicPerson | null;
}

export interface RatingSummary {
    average: number | null;
    count: number;
}

export interface UserReviews {
    items: Review[];
    summary: RatingSummary;
}

export interface ReviewPayload {
    rating: number;
    comment: string;
}
