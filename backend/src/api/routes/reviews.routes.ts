import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    createReview,
    getMyReview,
    listMyReviews,
    removeMyReview,
    updateMyReview
} from '../controllers/review.controller';

// /api/reviews : les avis écrits par l'utilisateur connecté (cloisonnés par auteur)
const router = Router();

router.use(requireAuth);

router.get('/', listMyReviews);
router.post('/', createReview);
router.get('/:id', getMyReview);
router.patch('/:id', updateMyReview);
router.delete('/:id', removeMyReview);

export default router;
