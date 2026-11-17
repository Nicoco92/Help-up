import { Router } from 'express'
import { listExploreMissions, readExploreMission } from '../controllers/explore.controller'
import { requireAuth } from '../middlewares/auth'

// Les erreurs sont formatées par l'errorHandler global (middlewares/errorHandler.ts)
const router = Router()

router.use(requireAuth)
router.get('/missions', listExploreMissions)
router.get('/missions/:id', readExploreMission)

export default router
