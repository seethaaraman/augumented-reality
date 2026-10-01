import { Router } from 'express';
import {
  getMenu,
  getDishById,
  createDish,
  updateDish,
  deleteDish
} from '../controllers/menuController.js';

const router = Router();

// Full MongoDB Menu CRUD routes
router.get('/', getMenu);
router.get('/:id', getDishById);
router.post('/', createDish);
router.put('/:id', updateDish);
router.delete('/:id', deleteDish);

export default router;
