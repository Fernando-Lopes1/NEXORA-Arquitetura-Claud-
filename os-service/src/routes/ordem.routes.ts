import { Router } from 'express';
import {
  listOrdens,
  getOrdemById,
  createOrdem,
  updateOrdem,
  deleteOrdem,
  updateOrdemStatus,
  getMensageriaStatus
} from '../controllers/ordem.controller';

const router = Router();

router.get('/mensageria/status', getMensageriaStatus);
router.get('/', listOrdens);
router.post('/', createOrdem);
router.get('/:id', getOrdemById);
router.put('/:id', updateOrdem);
router.delete('/:id', deleteOrdem);
router.patch('/:id/status', updateOrdemStatus);

export default router;
