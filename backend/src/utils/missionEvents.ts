import { EventEmitter } from 'node:events';
import type { Types } from 'mongoose';

// Ce que les abonnés reçoivent d'une mission créée
export interface CreatedMission {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    title: string;
    category: string;
    quartier: string;
    rewardCents: number;
}

// Événements des missions : le modèle les émet, les notifications les écoutent.
// Le CRUD des missions (Nicolas) n'a donc rien à appeler : créer une mission suffit à prévenir les voisins.
interface MissionEvents {
    created: [mission: CreatedMission];
}

export const missionEvents = new EventEmitter<MissionEvents>();
