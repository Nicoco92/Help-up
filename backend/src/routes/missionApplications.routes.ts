import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    acceptApplication,
    listMissionApplications,
    rejectApplication
} from '../controllers/application.controller';
import { completeMission } from '../controllers/dashboard.controller';

// /api/missions/:id/applications et /api/missions/:id/complete : suivi d'une de MES missions (sinon 404)
// Routeur séparé de missions.routes.ts (CRUD de Nicolas), monté sur le même préfixe dans app.ts
const router = Router();

router.get('/:id/applications', requireAuth, listMissionApplications);
router.post('/:id/applications/:applicationId/accept', requireAuth, acceptApplication);
router.post('/:id/applications/:applicationId/reject', requireAuth, rejectApplication);

// Clôture d'une mission attribuée par son propriétaire : assigned → completed
router.post('/:id/complete', requireAuth, completeMission);

export default router;
