// Types de notifications : une seule source pour le modèle, l'API et les scripts de base.
// Toute modification doit être reportée dans backend/sql/seed.js (et son bloc dans migration/seed-demo.js).
export const NOTIFICATION_TYPES = [
  'mission_nearby', // une mission publiée près de chez moi, dans une de mes compétences
  'application_received', // quelqu'un a postulé à ma mission
  'application_accepted', // ma candidature est acceptée
  'application_rejected', // ma candidature est refusée (ou la mission a été confiée à un autre)
  'mission_completed', // le client a clôturé la mission que j'ai réalisée
  'review_received', // on m'a laissé un avis
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
