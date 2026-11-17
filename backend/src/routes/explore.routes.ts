import { Router } from 'express'
import { listExploreMissions, readExploreMission } from '../controllers/explore.controller'
import { requireAuth } from '../middlewares/auth.middleware'

// Recherche des missions ouvertes des autres membres. Les erreurs remontent au
// gestionnaire centralisé (middlewares/error.middleware.ts), comme pour /api/auth et /api/users.
const router = Router()

router.use(requireAuth)
router.get('/missions', listExploreMissions)
router.get('/missions/:id', readExploreMission)

export default router
