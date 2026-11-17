import { z } from 'zod';

// Note entière de 1 à 5 étoiles
const ratingField = z
    .number({ error: 'La note est obligatoire (nombre de 1 à 5)' })
    .int('La note doit être un nombre entier')
    .min(1, 'La note doit être comprise entre 1 et 5')
    .max(5, 'La note doit être comprise entre 1 et 5');

// Commentaire facultatif ; une chaîne vide l'efface
const commentField = z
    .string({ error: 'Le commentaire doit être un texte' })
    .trim()
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères');

// POST /api/reviews : authorId et targetId sont fixés par le serveur
// strictObject refuse tout autre champ (id, authorId, targetId…) avec un 400
export const createReviewSchema = z.strictObject({
    missionId: z
        .string({ error: 'La mission est obligatoire' })
        .regex(/^[a-f\d]{24}$/i, 'Identifiant de mission invalide'),
    rating: ratingField,
    comment: commentField.optional()
});

// PATCH /api/reviews/:id : partiel, mais jamais vide
export const updateReviewSchema = z
    .strictObject({
        rating: ratingField.optional(),
        comment: commentField.optional()
    })
    .refine((data) => data.rating !== undefined || data.comment !== undefined, {
        message: 'Indiquez au moins une note ou un commentaire à modifier'
    });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
