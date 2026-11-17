import type { RequestHandler } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import AppError from '../utils/AppError';
import { isObjectId } from '../utils/objectId';

// Id de l'utilisateur connecté, disponible dans res.locals.userId après requireAuth
declare module 'express-serve-static-core' {
    interface Locals {
        userId?: string;
    }
}

// Exige un JWT valide (Authorization: Bearer <token>), sinon 401 UNAUTHORIZED
export const requireAuth: RequestHandler = (req, res, next) => {
    const match = req.get('authorization')?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
        return next(AppError.unauthorized('Authentication required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return next(new Error('JWT_SECRET is missing'));
    }

    // Signature vérifiée et date d'expiration contrôlée par jsonwebtoken
    let payload: string | jwt.JwtPayload;
    try {
        payload = jwt.verify(match[1], secret);
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            return next(AppError.unauthorized('Invalid or expired token'));
        }
        return next(error);
    }

    // Le payload doit contenir l'id de l'utilisateur : { sub: userId }
    const userId = typeof payload === 'string' ? undefined : payload.sub;
    if (!userId || !isObjectId(userId)) {
        return next(AppError.unauthorized('Invalid or expired token'));
    }

    res.locals.userId = userId;
    next();
};
