import { Schema, model, type InferSchemaType } from 'mongoose';
import { APPLICATION_STATUSES } from '../constants/statuses';
import { toJSON } from './plugins/toJSON';

// Candidature d'un utilisateur à une mission (voir docs/modele-donnees.md)
const applicationSchema = new Schema(
    {
        // Champs fixés par le serveur
        applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: APPLICATION_STATUSES, default: 'pending', required: true },

        // Champs envoyés par le client
        missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
        message: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 }
    },
    { timestamps: true, versionKey: false }
);

// Index : mêmes noms que dans sql/seed.js, sinon Mongo refuse de les recréer
// L'index unique empêche de postuler deux fois à la même mission (409 CONFLICT dans errorHandler)
applicationSchema.index({ missionId: 1, applicantId: 1 }, { name: 'one_application_per_mission', unique: true });
applicationSchema.index({ applicantId: 1, createdAt: -1 }, { name: 'applicant_recent' });
applicationSchema.index({ missionId: 1, status: 1 }, { name: 'mission_status' });

applicationSchema.plugin(toJSON);

export type IApplication = InferSchemaType<typeof applicationSchema>;

export const Application = model('Application', applicationSchema);
