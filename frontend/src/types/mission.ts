export type MissionStatus = 'open' | 'assigned' | 'completed' | 'cancelled'

export interface Mission {
  id: string
  ownerId: string
  providerId: string | null
  title: string
  description: string
  rewardCents: number
  estimatedMinutes: number
  category: string
  categoryLabel: string
  scheduledAt: string
  quartier: string
  quartierLabel: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  status: MissionStatus
  urgent: boolean
  createdAt: string
  updatedAt?: string
  owner: {
    id: string
    firstName: string
    city?: string
    avatarUrl?: string
  } | null
  alreadyApplied?: boolean
}

export interface MissionListResponse {
  items: Mission[]
}

// Mission renvoyée par /api/missions (mes missions) : les champs bruts du modèle, sans les libellés
// ni le propriétaire qu'ajoute le catalogue /api/explore.
export interface MyMission {
  id: string
  ownerId: string
  providerId: string | null
  title: string
  description: string
  rewardCents: number
  estimatedMinutes: number
  category: string
  scheduledAt: string
  quartier: string
  location: { type: 'Point'; coordinates: [number, number] }
  status: MissionStatus
  urgent: boolean
  hidden: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// Corps de POST /api/missions (ownerId, status, location… sont calculés par le serveur).
export interface MissionPayload {
  title: string
  description: string
  rewardCents: number
  estimatedMinutes: number
  category: string
  scheduledAt: string
  quartier: string
  urgent: boolean
}

// Corps de PATCH /api/missions/:id : partiel, au moins un champ.
export type MissionUpdatePayload = Partial<MissionPayload> & { hidden?: boolean }
