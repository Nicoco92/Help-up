import type { MissionSummary } from './application';

// L'autre participant d'une mission (prénom, initiale du nom, ville)
export interface PublicPerson {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
}

export interface DashboardMission extends MissionSummary {
    completedAt: string | null;
    // owner = je l'ai publiée, provider = je la réalise
    role: 'owner' | 'provider';
    pendingApplications: number;
    totalApplications: number;
    // Prestataire retenu (mes missions) ou client (missions obtenues)
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
    published: DashboardMission[];
    obtained: DashboardMission[];
    history: DashboardMission[];
}
