import type { MissionStatus } from './mission';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// Résumé de mission renvoyé avec une candidature
export interface MissionSummary {
    id: string;
    ownerId: string;
    providerId: string | null;
    title: string;
    status: MissionStatus;
    rewardCents: number;
    estimatedMinutes: number;
    category: string;
    categoryLabel: string;
    quartier: string;
    quartierLabel: string;
    scheduledAt: string;
    urgent: boolean;
}

// Profil public d'un candidat (nom réduit à l'initiale, ni email ni téléphone)
export interface PublicApplicant {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
    skills: string[];
}

export interface Application {
    id: string;
    missionId: string;
    applicantId: string;
    message: string;
    status: ApplicationStatus;
    createdAt: string;
    updatedAt: string;
    mission?: MissionSummary | null;
    applicant?: PublicApplicant | null;
}
