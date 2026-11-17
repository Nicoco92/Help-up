import type { Request, RequestHandler } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { UnauthorizedError } from '../utils/errors';

// requireAuth renseigne req.userId ; ce garde-fou ne sert que si la route est mal montée
const currentUserId = (req: Request): string => {
    if (!req.userId) {
        throw new UnauthorizedError('Authentification requise');
    }
    return req.userId;
};

// GET /api/dashboard : missions publiées (avec candidats), obtenues, historique
export const getDashboard: RequestHandler = async (req, res) => {
    res.status(200).json(await dashboardService.get(currentUserId(req)));
};

// POST /api/missions/:id/complete : le propriétaire clôture une mission attribuée
export const completeMission: RequestHandler<{ id: string }> = async (req, res) => {
    res.status(200).json(await dashboardService.complete(currentUserId(req), req.params.id));
};
