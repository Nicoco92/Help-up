import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    acceptApplication,
    listMissionApplications,
    rejectApplication
} from '../controllers/application.controller';

// /api/missions/:id/applications : candidats d'une de MES missions (sinon 404)
// Routeur séparé de missions.routes.ts (CRUD de Nicolas), monté sur le même préfixe dans app.ts
const router = Router();

router.get('/:id/applications', requireAuth, listMissionApplications);
router.post('/:id/applications/:applicationId/accept', requireAuth, acceptApplication);
router.post('/:id/applications/:applicationId/reject', requireAuth, rejectApplication);

export default router;
