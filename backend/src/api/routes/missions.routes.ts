import { Router } from 'express'
import { missionController } from '../controllers/mission.controller'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'

// /api/missions : MES missions publiées (cloisonnées par ownerId). Contrat : openapi/paths/missions.yaml
// Un membre crée, modifie et masque ses missions ; seul un administrateur les supprime.
const router = Router()

router.use(requireAuth)

router.get('/', (req, res) => missionController.list(req, res))
router.post('/', (req, res) => missionController.create(req, res))
router.get('/:id', (req, res) => missionController.get(req, res))
router.patch('/:id', (req, res) => missionController.update(req, res))
router.delete('/:id', requireRole('admin'), (req, res) => missionController.remove(req, res))

export default router
