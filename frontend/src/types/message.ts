import type { MissionSummary } from './application';
import type { PublicPerson } from './dashboard';

// Message privé entre le client et le prestataire d'une mission attribuée
export interface Message {
    id: string;
    missionId: string;
    senderId: string;
    recipientId: string;
    body: string;
    // true = envoyé par moi
    mine: boolean;
    // Lu par son destinataire
    read: boolean;
    readAt: string | null;
    createdAt: string;
}

// Une conversation = une mission attribuée (même identifiant)
export interface Conversation {
    id: string;
    mission: MissionSummary;
    role: 'owner' | 'provider';
    counterpart: PublicPerson | null;
    // false une fois la mission terminée : le fil reste lisible
    canWrite: boolean;
    lastMessage: Message | null;
    unreadCount: number;
}
