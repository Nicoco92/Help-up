import type { Request, RequestHandler } from 'express';
import { messageService } from '../services/message.service';
import { createMessageSchema, listMessagesQuerySchema } from '../validators/message.validator';
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

export const listMyConversations: RequestHandler = async (req, res) => {
    res.status(200).json({ items: await messageService.listConversations(currentUserId(req)) });
};

// Appelée régulièrement par le front pour la pastille « Messages » : une seule requête de comptage
export const countUnreadMessages: RequestHandler = async (req, res) => {
    res.status(200).json({ count: await messageService.unreadCount(currentUserId(req)) });
};

export const getMyConversation: RequestHandler<{ id: string }> = async (req, res) => {
    res.status(200).json(await messageService.getConversation(currentUserId(req), req.params.id));
};

export const listConversationMessages: RequestHandler<{ id: string }> = async (req, res) => {
    const { after } = listMessagesQuerySchema.parse(req.query);
    res.status(200).json({ items: await messageService.listMessages(currentUserId(req), req.params.id, after) });
};

export const sendMessage: RequestHandler<{ id: string }> = async (req, res) => {
    const data = createMessageSchema.parse(req.body);
    res.status(201).json(await messageService.send(currentUserId(req), req.params.id, data));
};
