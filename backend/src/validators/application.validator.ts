import { z } from 'zod';

// Message de motivation : mêmes bornes que le modèle Application (10 à 500 caractères)
const messageField = z
    .string({ error: 'Le message est obligatoire' })
    .trim()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(500, 'Le message ne peut pas dépasser 500 caractères');

// POST /api/applications : applicantId et status sont fixés par le serveur
// strictObject refuse tout autre champ (id, applicantId, status…) avec un 400
export const createApplicationSchema = z.strictObject({
    missionId: z
        .string({ error: 'La mission est obligatoire' })
        .regex(/^[a-f\d]{24}$/i, 'Identifiant de mission invalide'),
    message: messageField
});

// PATCH /api/applications/:id : seul le message est modifiable, tant que la candidature est en attente
export const updateApplicationSchema = z.strictObject({
    message: messageField
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
