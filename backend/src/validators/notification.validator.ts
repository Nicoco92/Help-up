import { z } from 'zod';

// PATCH /api/notifications/:id : seul l'état lu / non lu est modifiable
export const updateNotificationSchema = z.strictObject({
    read: z.boolean({ error: 'Le champ read doit valoir true ou false' })
});

// GET /api/notifications?unread=true : seulement les non lues
export const listNotificationsQuerySchema = z.strictObject({
    unread: z.enum(['true', 'false'], { error: 'Le filtre unread doit valoir true ou false' }).optional()
});

export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
