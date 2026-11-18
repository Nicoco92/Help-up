import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { messageLimiter } from '../middlewares/rateLimit.middleware';
import {
    countUnreadMessages,
    getMyConversation,
    listConversationMessages,
    listMyConversations,
    sendMessage
} from '../controllers/message.controller';

// /api/conversations : messagerie privée entre le client et le prestataire d'une mission attribuée.
// L'identifiant d'une conversation est celui de la mission. Contrat : openapi/paths/conversations.yaml
const router = Router();

router.use(requireAuth);

router.get('/', listMyConversations);
// Avant /:id, sinon « unread-count » serait lu comme un identifiant
router.get('/unread-count', countUnreadMessages);
router.get('/:id', getMyConversation);
router.get('/:id/messages', listConversationMessages);
router.post('/:id/messages', messageLimiter, sendMessage);

export default router;
