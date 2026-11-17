import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    createApplication,
    getMyApplication,
    listMyApplications,
    removeMyApplication,
    updateMyApplication
} from '../controllers/application.controller';

// /api/applications : les candidatures de l'utilisateur connecté (cloisonnées par candidat)
const router = Router();

router.use(requireAuth);

router.get('/', listMyApplications);
router.post('/', createApplication);
router.get('/:id', getMyApplication);
router.patch('/:id', updateMyApplication);
router.delete('/:id', removeMyApplication);

export default router;
