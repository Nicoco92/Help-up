import type { Request, RequestHandler } from 'express';
import { notificationService } from '../services/notification.service';
import { listNotificationsQuerySchema, updateNotificationSchema } from '../validators/notification.validator';
import { UnauthorizedError } from '../utils/errors';

// requireAuth renseigne req.userId ; ce garde-fou ne sert que si la route est mal montée
const currentUserId = (req: Request): string => {
    if (!req.userId) {
        throw new UnauthorizedError('Authentification requise');
    }
    return req.userId;
};

export const listMyNotifications: RequestHandler = async (req, res) => {
    const { unread } = listNotificationsQuerySchema.parse(req.query);
    res.status(200).json(await notificationService.listMine(currentUserId(req), unread === 'true'));
};

// Appelée régulièrement par le front pour la pastille de la cloche : une seule requête de comptage
export const countUnread: RequestHandler = async (req, res) => {
    res.status(200).json({ count: await notificationService.unreadCount(currentUserId(req)) });
};

export const markAllRead: RequestHandler = async (req, res) => {
    res.status(200).json({ updated: await notificationService.markAllRead(currentUserId(req)) });
};

export const getMyNotification: RequestHandler<{ id: string }> = async (req, res) => {
    res.status(200).json(await notificationService.getMine(currentUserId(req), req.params.id));
};

export const updateMyNotification: RequestHandler<{ id: string }> = async (req, res) => {
    const { read } = updateNotificationSchema.parse(req.body);
    res.status(200).json(await notificationService.markMine(currentUserId(req), req.params.id, read));
};

export const removeMyNotification: RequestHandler<{ id: string }> = async (req, res) => {
    await notificationService.removeMine(currentUserId(req), req.params.id);
    res.status(204).end();
};
