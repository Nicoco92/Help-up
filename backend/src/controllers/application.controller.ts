import type { Request, RequestHandler } from 'express';
import { applicationService } from '../services/application.service';
import { createApplicationSchema, updateApplicationSchema } from '../validators/application.validator';
import { UnauthorizedError } from '../utils/errors';

// Express 5 transmet tout seul les erreurs des fonctions async à error.middleware :
// pas de try/catch dans les contrôleurs

// requireAuth renseigne req.userId ; ce garde-fou ne sert que si la route est mal montée
const currentUserId = (req: Request): string => {
    if (!req.userId) {
        throw new UnauthorizedError('Authentification requise');
    }
    return req.userId;
};

// --- /api/applications : mes candidatures ---

export const listMyApplications: RequestHandler = async (req, res) => {
    res.status(200).json({ items: await applicationService.listMine(currentUserId(req)) });
};

export const createApplication: RequestHandler = async (req, res) => {
    const data = createApplicationSchema.parse(req.body);
    res.status(201).json(await applicationService.create(currentUserId(req), data));
};

export const getMyApplication: RequestHandler<{ id: string }> = async (req, res) => {
    res.status(200).json(await applicationService.getMine(currentUserId(req), req.params.id));
};

export const updateMyApplication: RequestHandler<{ id: string }> = async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);
    res.status(200).json(await applicationService.updateMine(currentUserId(req), req.params.id, data));
};

export const removeMyApplication: RequestHandler<{ id: string }> = async (req, res) => {
    await applicationService.removeMine(currentUserId(req), req.params.id);
    res.status(204).end();
};

// --- /api/missions/:id/applications : candidats d'une de mes missions ---

export const listMissionApplications: RequestHandler<{ id: string }> = async (req, res) => {
    res.status(200).json({ items: await applicationService.listForMission(currentUserId(req), req.params.id) });
};

export const acceptApplication: RequestHandler<{ id: string; applicationId: string }> = async (req, res) => {
    const { id, applicationId } = req.params;
    res.status(200).json(await applicationService.accept(currentUserId(req), id, applicationId));
};

export const rejectApplication: RequestHandler<{ id: string; applicationId: string }> = async (req, res) => {
    const { id, applicationId } = req.params;
    res.status(200).json(await applicationService.reject(currentUserId(req), id, applicationId));
};
