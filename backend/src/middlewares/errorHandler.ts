import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import AppError from '../utils/AppError';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {

    // Réponse déjà partiellement envoyée : on laisse Express couper la connexion
    if (res.headersSent) {
        return next(err);
    }

    // Codes erreurs personnalisés de l'application
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message
            }
        });
    }

    // Corps JSON mal formé
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: { code: 'INVALID_INPUT', message: 'Malformed JSON body' }
        });
    }

    // ID MongoDB invalide
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            error: { code: 'INVALID_INPUT', message: `Invalid ${err.path}` }
        });
    }

    // Doublon sur un index unique (ex. deux candidatures sur la même mission)
    if (err.code === 11000) {
        return res.status(409).json({
            error: { code: 'CONFLICT', message: 'Resource already exists' }
        });
    }

    // Erreur interne du serveur
    console.error(err);
    return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
};

export const notFound: RequestHandler = (req, res, next) => {
    next(AppError.notFound('Missing route'));
};