import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'

const router = Router()

// Toutes les routes /api/users exigent un JWT valide.
router.use(requireAuth)

router.get('/me', (req, res) => userController.getMe(req, res))
router.patch('/me', (req, res) => userController.updateMe(req, res))
router.delete('/me', (req, res) => userController.deleteMe(req, res))
router.get('/', (req, res) => userController.listUsers(req, res))
router.get('/:id', (req, res) => userController.getUserById(req, res))
router.delete('/:id', requireRole('admin'), (req, res) => userController.deleteUser(req, res))
router.patch('/:id/role', requireRole('admin'), (req, res) =>
  userController.updateUserRole(req, res),
)

export default router
