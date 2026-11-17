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
