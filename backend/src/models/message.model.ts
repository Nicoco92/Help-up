import { Schema, model, type InferSchemaType } from 'mongoose';
import { toJSON } from './plugins/toJSON';

// Message privé entre le client et le prestataire d'une mission attribuée (voir docs/modele-donnees.md).
// La conversation, c'est la mission : ses deux participants sont ownerId et providerId,
// fixés quand le client accepte une candidature. Pas de collection « conversations » à tenir à jour.
const messageSchema = new Schema(
    {
        // Champs fixés par le serveur : l'expéditeur vient du JWT, le destinataire est l'autre participant
        missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        // null = pas encore lu par le destinataire
        readAt: { type: Date, default: null },

        // Champ envoyé par le client
        body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 }
    },
    { timestamps: true, versionKey: false }
);

// Index : mêmes noms que dans sql/seed.js, sinon Mongo refuse de les recréer
messageSchema.index({ missionId: 1, createdAt: 1 }, { name: 'mission_thread' });
messageSchema.index({ recipientId: 1, readAt: 1 }, { name: 'recipient_unread' });

messageSchema.plugin(toJSON);

export type IMessage = InferSchemaType<typeof messageSchema>;

export const Message = model('Message', messageSchema);
