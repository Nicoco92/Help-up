import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit.middleware'

const router = Router()

router.post('/register', registerLimiter, (req, res) => authController.register(req, res))
router.post('/login', loginLimiter, (req, res) => authController.login(req, res))
router.post('/refresh', requireAuth, (req, res) => authController.refresh(req, res))

export default router
