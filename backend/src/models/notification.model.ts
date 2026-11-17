import { Schema, model, type InferSchemaType } from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/notifications';
import { toJSON } from '../utils/toJSON';

// Notification envoyée à un membre par le serveur (jamais créée par le client)
const notificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: NOTIFICATION_TYPES, required: true },
        // Texte prêt à afficher, figé au moment de l'envoi
        message: { type: String, required: true, trim: true, minlength: 1, maxlength: 300 },
        // Page du front où aller en cliquant (chemin relatif : /dashboard, /missions/:id…)
        link: { type: String, required: true, maxlength: 200, match: /^\/[\w\-/]*$/ },
        missionId: { type: Schema.Types.ObjectId, ref: 'Mission', default: null },
        // null = non lue
        readAt: { type: Date, default: null }
    },
    { timestamps: true, versionKey: false }
);

// Index : mêmes noms que dans sql/seed.js, sinon Mongo refuse de les recréer
notificationSchema.index({ userId: 1, createdAt: -1 }, { name: 'user_recent' });
notificationSchema.index({ userId: 1, readAt: 1 }, { name: 'user_unread' });
// Mongo supprime tout seul les notifications de plus de 90 jours
notificationSchema.index({ createdAt: 1 }, { name: 'expire_after_90_days', expireAfterSeconds: 90 * 24 * 3600 });

notificationSchema.plugin(toJSON);

export type INotification = InferSchemaType<typeof notificationSchema>;

export const Notification = model('Notification', notificationSchema);
