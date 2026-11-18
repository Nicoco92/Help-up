import { z } from 'zod';

// POST /api/conversations/:id/messages : seul le texte vient du client.
// strictObject refuse tout autre champ (id, senderId, recipientId, missionId…) avec un 400
export const createMessageSchema = z.strictObject({
    body: z
        .string({ error: 'Le message est obligatoire' })
        .trim()
        .min(1, 'Le message ne peut pas être vide')
        .max(2000, 'Le message ne peut pas dépasser 2000 caractères')
});

// GET /api/conversations/:id/messages?after=<id> : seulement les messages plus récents que celui-ci
// (le front ne recharge pas tout le fil à chaque rafraîchissement)
export const listMessagesQuerySchema = z.strictObject({
    after: z
        .string()
        .regex(/^[a-f\d]{24}$/i, 'Identifiant de message invalide')
        .optional()
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
