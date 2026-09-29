import { Router } from 'express';
import { getMenu, getDishById } from '../controllers/menuController.js';

const router = Router();

router.get('/', getMenu);
router.get('/:id', getDishById);

export default router;
