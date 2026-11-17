import type { RequestHandler } from 'express';
import type { z } from 'zod';

// Vérifie req.body avec le schéma zod donné, avant le contrôleur
// En cas d'échec, la ZodError part vers error.middleware.ts, qui répond 400 INVALID_INPUT
// Équivaut à appeler schema.parse(req.body) au début du contrôleur
export const validate = (schema: z.ZodType): RequestHandler => (req, res, next) => {
    // Donnée valide : le contrôleur reçoit la version nettoyée par zod
    req.body = schema.parse(req.body);
    next();
};
