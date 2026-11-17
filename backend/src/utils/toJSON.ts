import type { Schema } from 'mongoose';

// Plugin Mongoose : forme des documents renvoyés par l'API (res.json)
// - _id devient id (chaîne), comme l'exige le contrat
// - __v et passwordHash ne sortent jamais
export const toJSON = (schema: Schema): void => {
    schema.set('toJSON', {
        transform: (doc, ret: Record<string, unknown>) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash;
            return ret;
        }
    });
};
