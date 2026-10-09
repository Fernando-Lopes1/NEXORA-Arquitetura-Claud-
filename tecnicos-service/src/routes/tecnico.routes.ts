import { Router } from 'express';
import {
  listTecnicos,
  getTecnicoById,
  createTecnico,
  updateTecnico,
  deleteTecnico,
  updateDisponibilidade
} from '../controllers/tecnico.controller';

const router = Router();

router.get('/', listTecnicos);
router.post('/', createTecnico);
router.get('/:id', getTecnicoById);
router.put('/:id', updateTecnico);
router.delete('/:id', deleteTecnico);
router.patch('/:id/disponibilidade', updateDisponibilidade);

export default router;
