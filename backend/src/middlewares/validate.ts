import type { RequestHandler } from 'express';
import type { z } from 'zod';
import AppError from '../utils/AppError';

// Vérifie req.body avec le schéma zod donné, avant le contrôleur
export const validate = (schema: z.ZodType): RequestHandler => (req, res, next) => {
    const result = schema.safeParse(req.body);

    // Donnée invalide : on renvoie le premier problème trouvé (400 INVALID_INPUT)
    if (!result.success) {
        const issue = result.error.issues[0];
        const field = issue.path.join('.');
        return next(AppError.invalidInput(field ? `${field}: ${issue.message}` : issue.message));
    }

    // Donnée valide : le contrôleur reçoit la version nettoyée par zod
    req.body = result.data;
    next();
};
