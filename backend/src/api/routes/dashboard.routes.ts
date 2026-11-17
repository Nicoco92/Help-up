import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getDashboard } from '../controllers/dashboard.controller';

// /api/dashboard : vue d'ensemble de l'utilisateur connecté
const router = Router();

router.get('/', requireAuth, getDashboard);

export default router;
