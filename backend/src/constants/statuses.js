// Statuts : une seule source pour les modèles, la validation zod et les scripts de base.
const MISSION_STATUSES = ['open', 'assigned', 'completed', 'cancelled']
const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn']

module.exports = { MISSION_STATUSES, APPLICATION_STATUSES }
