import { z } from 'zod'
import { CATEGORY_SLUGS } from '../../constants/categories'
import { QUARTIER_SLUGS } from '../../constants/quartiers'
import { MISSION_STATUSES } from '../../constants/statuses'

// Règles d'une mission (docs/modele-donnees.md). Les messages restent en français : le front les affiche tels quels.

const titleField = z
  .string()
  .trim()
  .min(5, 'Le titre doit contenir au moins 5 caractères')
  .max(80, 'Le titre ne doit pas dépasser 80 caractères')

const descriptionField = z
  .string()
  .trim()
  .min(10, 'La description doit contenir au moins 10 caractères')
  .max(1000, 'La description ne doit pas dépasser 1000 caractères')

const rewardCentsField = z
  .number({ error: 'La rémunération doit être un nombre de centimes' })
  .int('La rémunération doit être un nombre entier de centimes')
  .min(500, 'La rémunération minimale est de 5 €')
  .max(50000, 'La rémunération maximale est de 500 €')

const estimatedMinutesField = z
  .number({ error: 'La durée estimée doit être un nombre de minutes' })
  .int('La durée estimée doit être un nombre entier de minutes')
  .min(15, 'La durée estimée minimale est de 15 minutes')
  .max(480, 'La durée estimée maximale est de 8 heures')

const categoryField = z.enum(CATEGORY_SLUGS, { error: 'Catégorie inconnue' })

const quartierField = z.enum(QUARTIER_SLUGS, { error: 'Quartier inconnu' })

// Date ISO 8601 avec fuseau (ex. 2026-12-05T10:00:00.000Z), obligatoirement dans le futur.
const scheduledAtField = z
  .iso.datetime({ offset: true, error: 'Date invalide (format ISO 8601 attendu)' })
  .transform((value) => new Date(value))
  .refine((date) => date.getTime() > Date.now(), 'La date de la mission doit être dans le futur')

const urgentField = z.boolean({ error: 'urgent doit être un booléen' })

// strictObject : id, ownerId, status, location… ou tout champ inconnu → 400 INVALID_INPUT.
export const createMissionSchema = z.strictObject({
  title: titleField,
  description: descriptionField,
  rewardCents: rewardCentsField,
  estimatedMinutes: estimatedMinutesField,
  category: categoryField,
  scheduledAt: scheduledAtField,
  quartier: quartierField,
  urgent: urgentField.optional(),
})

// PATCH partiel : mêmes règles, tous les champs facultatifs, mais au moins un.
export const updateMissionSchema = z
  .strictObject({
    title: titleField.optional(),
    description: descriptionField.optional(),
    rewardCents: rewardCentsField.optional(),
    estimatedMinutes: estimatedMinutesField.optional(),
    category: categoryField.optional(),
    scheduledAt: scheduledAtField.optional(),
    quartier: quartierField.optional(),
    urgent: urgentField.optional(),
    // Masquer / réafficher la mission dans le catalogue (le membre ne peut pas la supprimer).
    hidden: z.boolean({ error: 'hidden doit être un booléen' }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Indique au moins un champ à modifier',
  })

// Filtres de GET /api/missions
export const listMissionsQuerySchema = z.object({
  status: z.enum(MISSION_STATUSES, { error: 'Statut inconnu' }).optional(),
})

export type CreateMissionInput = z.infer<typeof createMissionSchema>
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>
export type ListMissionsQuery = z.infer<typeof listMissionsQuerySchema>
