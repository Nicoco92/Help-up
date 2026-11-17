import type { RequestHandler } from 'express';
import type { z } from 'zod';
import AppError from '../utils/AppError';

// Vérifie une donnée avec un schéma zod : renvoie la version nettoyée, sinon lève 400 INVALID_INPUT
// Sert aussi pour req.query, qui est en lecture seule en Express 5 (on parse dans le contrôleur)
export const parse = <T extends z.ZodType>(schema: T, input: unknown): z.output<T> => {
    const result = schema.safeParse(input);

    // Donnée invalide : on renvoie le premier problème trouvé
    if (!result.success) {
        const issue = result.error.issues[0];
        const field = issue.path.join('.');
        throw AppError.invalidInput(field ? `${field}: ${issue.message}` : issue.message);
    }

    return result.data;
};

// Vérifie req.body avec le schéma zod donné, avant le contrôleur
export const validate = (schema: z.ZodType): RequestHandler => (req, res, next) => {
    // Donnée valide : le contrôleur reçoit la version nettoyée par zod
    req.body = parse(schema, req.body);
    next();
};
