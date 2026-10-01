import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import {
  createScannedDish,
  getCustomDishes,
  deleteCustomDish,
  getUploadSignature,
  saveScannedDishMetadata
} from '../controllers/scanController.js';

const router = Router();

// Store temporary uploads in OS temp directory
const upload = multer({
  dest: path.join(os.tmpdir(), 'ar_dish_uploads'),
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB limit for 4K video or high-res .glb
  }
});

// Routes
router.post('/dish', upload.single('file'), createScannedDish);
router.get('/signature', getUploadSignature);
router.post('/save', saveScannedDishMetadata);
router.get('/custom-dishes', getCustomDishes);
router.delete('/custom-dish/:id', deleteCustomDish);

export default router;
