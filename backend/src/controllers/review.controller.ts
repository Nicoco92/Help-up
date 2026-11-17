import type { Request, RequestHandler } from 'express';
import { reviewService } from '../services/review.service';
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator';
import { UnauthorizedError } from '../utils/errors';

// requireAuth renseigne req.userId ; ce garde-fou ne sert que si la route est mal montée
const currentUserId = (req: Request): string => {
    if (!req.userId) {
        throw new UnauthorizedError('Authentification requise');
    }
    return req.userId;
};

// --- /api/reviews : les avis que j'ai écrits ---

export const listMyReviews: RequestHandler = async (req, res) => {
    res.status(200).json({ items: await reviewService.listMine(currentUserId(req)) });
};

export const createReview: RequestHandler = async (req, res) => {
    const data = createReviewSchema.parse(req.body);
    res.status(201).json(await reviewService.create(currentUserId(req), data));
};

export const getMyReview: RequestHandler<{ id: string }> = async (req, res) => {
    res.status(200).json(await reviewService.getMine(currentUserId(req), req.params.id));
};

export const updateMyReview: RequestHandler<{ id: string }> = async (req, res) => {
    const data = updateReviewSchema.parse(req.body);
    res.status(200).json(await reviewService.updateMine(currentUserId(req), req.params.id, data));
};

export const removeMyReview: RequestHandler<{ id: string }> = async (req, res) => {
    await reviewService.removeMine(currentUserId(req), req.params.id);
    res.status(204).end();
};

// --- /api/users/:id/reviews : avis reçus par un membre ---

export const listUserReviews: RequestHandler<{ id: string }> = async (req, res) => {
    currentUserId(req);
    res.status(200).json(await reviewService.listForUser(req.params.id));
};
