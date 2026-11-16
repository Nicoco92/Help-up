// Statuts : une seule source pour les modèles, la validation zod et les scripts de base.
// Toute modification doit être reportée dans backend/sql/seed.js (et son bloc dans migration/seed-demo.js).
export const MISSION_STATUSES = ['open', 'assigned', 'completed', 'cancelled'] as const
export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'] as const

export type MissionStatus = (typeof MISSION_STATUSES)[number]
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]
