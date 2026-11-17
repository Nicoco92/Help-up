import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    countUnread,
    getMyNotification,
    listMyNotifications,
    markAllRead,
    removeMyNotification,
    updateMyNotification
} from '../controllers/notification.controller';

// /api/notifications : les notifications de l'utilisateur connecté (créées uniquement par le serveur)
const router = Router();

router.use(requireAuth);

router.get('/', listMyNotifications);
// Avant /:id, sinon « unread-count » serait lu comme un identifiant
router.get('/unread-count', countUnread);
router.post('/read-all', markAllRead);
router.get('/:id', getMyNotification);
router.patch('/:id', updateMyNotification);
router.delete('/:id', removeMyNotification);

export default router;
