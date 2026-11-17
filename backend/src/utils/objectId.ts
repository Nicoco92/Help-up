import { Types } from 'mongoose';
import { BadRequestError } from './errors';

// Un ObjectId MongoDB : exactement 24 caractères hexadécimaux
export const isObjectId = (id: string): boolean => /^[a-f\d]{24}$/i.test(id);

// Convertit un id reçu (paramètre d'URL) en ObjectId, sinon 400 INVALID_INPUT
export const toObjectId = (id: string, message = 'Identifiant invalide'): Types.ObjectId => {
    if (!isObjectId(id)) {
        throw new BadRequestError(message);
    }
    return new Types.ObjectId(id);
};
