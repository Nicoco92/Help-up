import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { listUserReviews } from '../controllers/review.controller';

// /api/users/:id/reviews : avis reçus par un membre et sa note moyenne
// Routeur séparé de user.routes.ts (Nicolas), monté sur le même préfixe dans app.ts
const router = Router();

router.get('/:id/reviews', requireAuth, listUserReviews);

export default router;
