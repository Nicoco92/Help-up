import { Router, type ErrorRequestHandler } from 'express'
import { listExploreMissions, readExploreMission } from '../controllers/explore.controller'
import { requireExploreAuth } from '../middlewares/exploreAuth'
import { ExploreError } from '../utils/ExploreError'

const router = Router()
const handleExploreError: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof ExploreError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    })
  }

  if (res.headersSent) {
    return next(error)
  }

  console.error(error)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur est survenue.' },
  })
}

router.use(requireExploreAuth)
router.get('/missions', listExploreMissions)
router.get('/missions/:id', readExploreMission)
router.use(handleExploreError)

export default router
