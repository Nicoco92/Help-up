import { Schema, model, type InferSchemaType } from 'mongoose';
import { toJSON } from './plugins/toJSON';

// Avis laissé après une mission terminée, par le client ou par le prestataire (voir docs/modele-donnees.md)
const reviewSchema = new Schema(
    {
        // Champs fixés par le serveur : l'auteur vient du JWT, la cible est déduite de la mission
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        // Champs envoyés par le client
        missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
        rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
        comment: { type: String, trim: true, maxlength: 500, default: '' }
    },
    { timestamps: true, versionKey: false }
);

// Index : mêmes noms que dans sql/seed.js, sinon Mongo refuse de les recréer
// L'index unique empêche de noter deux fois la même mission (409 CONFLICT dans errorHandler)
reviewSchema.index({ missionId: 1, authorId: 1 }, { name: 'one_review_per_mission', unique: true });
reviewSchema.index({ targetId: 1 }, { name: 'target' });

reviewSchema.plugin(toJSON);

export type IReview = InferSchemaType<typeof reviewSchema>;

export const Review = model('Review', reviewSchema);
