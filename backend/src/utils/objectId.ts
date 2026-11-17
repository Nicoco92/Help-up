import { Types } from 'mongoose';
import AppError from './AppError';

// Un ObjectId MongoDB : exactement 24 caractères hexadécimaux
export const isObjectId = (id: string): boolean => /^[a-f\d]{24}$/i.test(id);

// Convertit un id reçu (paramètre d'URL, JWT) en ObjectId, sinon 400 INVALID_INPUT
export const toObjectId = (id: string, message = 'Invalid id'): Types.ObjectId => {
    if (!isObjectId(id)) {
        throw AppError.invalidInput(message);
    }
    return new Types.ObjectId(id);
};
