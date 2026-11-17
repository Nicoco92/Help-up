import { Schema, model, type InferSchemaType } from 'mongoose';
import { CATEGORY_SLUGS } from '../constants/categories';
import { QUARTIER_SLUGS } from '../constants/quartiers';
import { MISSION_STATUSES } from '../constants/statuses';
import { toJSON } from './plugins/toJSON';
import { missionEvents } from './events/missionEvents';

// Mission publiée par un utilisateur (voir docs/modele-donnees.md)
const missionSchema = new Schema(
    {
        // Champs fixés par le serveur
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        providerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true }
        },
        status: { type: String, enum: MISSION_STATUSES, default: 'open', required: true },
        completedAt: { type: Date, default: null },

        // Champs envoyés par le client
        title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
        description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
        rewardCents: { type: Number, required: true, min: 500, max: 50000, validate: Number.isInteger },
        estimatedMinutes: { type: Number, required: true, min: 15, max: 480, validate: Number.isInteger },
        category: { type: String, enum: CATEGORY_SLUGS, required: true },
        scheduledAt: { type: Date, required: true },
        quartier: { type: String, enum: QUARTIER_SLUGS, required: true },
        urgent: { type: Boolean, default: false },
        // Masquée par son propriétaire : absente du catalogue (/api/explore), toujours visible dans « Mes missions ».
        // Un membre ne supprime pas ses missions, il les masque ; seul un administrateur supprime.
        hidden: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

// Index : mêmes noms que dans sql/seed.js, sinon Mongo refuse de les recréer
missionSchema.index({ location: '2dsphere' }, { name: 'location_2dsphere' });
missionSchema.index(
    { title: 'text', description: 'text' },
    { name: 'text_search', default_language: 'french', weights: { title: 3, description: 1 } }
);
missionSchema.index({ status: 1, category: 1, rewardCents: 1 }, { name: 'catalogue_filters' });
missionSchema.index({ ownerId: 1, createdAt: -1 }, { name: 'owner_recent' });
missionSchema.index({ providerId: 1, status: 1 }, { name: 'provider_status' });

missionSchema.plugin(toJSON);

// Nouvelle mission : on prévient les voisins concernés (notification.service écoute cet événement)
missionSchema.pre('save', function () {
    this.$locals.wasNew = this.isNew;
});
missionSchema.post('save', function (doc) {
    if (doc.$locals.wasNew) {
        const { _id, ownerId, title, category, quartier, rewardCents } = doc;
        missionEvents.emit('created', { _id, ownerId, title, category, quartier, rewardCents });
    }
});

export type IMission = InferSchemaType<typeof missionSchema>;

export const Mission = model('Mission', missionSchema);
