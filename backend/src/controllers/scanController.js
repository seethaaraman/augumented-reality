import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadGlbModel } from '../services/cloudinaryService.js';
import { generate3DFromImage } from '../services/aiScannerService.js';
import { extractFrameFromVideo } from '../services/videoProcessorService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CUSTOM_DISHES_PATH = path.resolve(__dirname, '../data/customDishes.json');

function readCustomDishes() {
  try {
    if (!fs.existsSync(CUSTOM_DISHES_PATH)) {
      fs.writeFileSync(CUSTOM_DISHES_PATH, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(CUSTOM_DISHES_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('[ScanController] Error reading custom dishes:', err);
    return [];
  }
}

function writeCustomDishes(dishes) {
  try {
    fs.writeFileSync(CUSTOM_DISHES_PATH, JSON.stringify(dishes, null, 2), 'utf8');
  } catch (err) {
    console.error('[ScanController] Error writing custom dishes:', err);
  }
}

function slugify(text) {
  return (text || 'dish')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Handles 3D scanning or direct model upload, saves to Cloudinary, and registers dish.
 */
export async function createScannedDish(req, res) {
  let tempFilePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image or 3D model file uploaded.'
      });
    }

    const {
      name = 'Scanned Dish',
      tagline = 'Freshly Scanned Delicacy',
      price = '₹290',
      dietary = 'Vegetarian',
      spiceLevel = '🌶️ Medium Spice',
      calories = '420 kcal',
      prepTime = '15 mins',
      description = 'Freshly scanned 3D delicacy served in immersive Augmented Reality.',
      ingredients = 'Fresh Organic Ingredients, Chef Spices'
    } = req.body;

    const dishSlug = slugify(name);
    let publicGlbUrl = '';

    const ext = path.extname(req.file.originalname).toLowerCase();
    const isGlbFile = ext === '.glb' || req.file.mimetype === 'model/gltf-binary';
    const isVideoFile = ['.mp4', '.mov', '.webm', '.m4v', '.avi'].includes(ext) || req.file.mimetype?.startsWith('video/');

    if (isGlbFile) {
      // 1. Direct .glb upload (e.g. from Meshy, Sketchfab, or scanned asset)
      console.log(`[ScanController] Direct .glb uploaded: ${req.file.originalname}`);
      publicGlbUrl = await uploadGlbModel(tempFilePath, dishSlug);
    } else if (isVideoFile) {
      // 2. 360° Video upload -> Extract keyframe -> AI 3D Reconstruction
      console.log(`[ScanController] Processing 360° video for 3D reconstruction: ${req.file.originalname}`);
      let extractedFramePath = null;
      try {
        extractedFramePath = await extractFrameFromVideo(tempFilePath);
        const generatedGlbPath = await generate3DFromImage(extractedFramePath);
        publicGlbUrl = await uploadGlbModel(generatedGlbPath, dishSlug);
      } catch (aiErr) {
        console.warn('[ScanController] Video AI processing error:', aiErr.message);
        return res.status(503).json({
          success: false,
          message: `The 3D AI generator is currently busy or queued (${aiErr.message}). You can also download a .glb model from Meshy and upload it directly!`,
          error: aiErr.message
        });
      } finally {
        if (extractedFramePath && fs.existsSync(extractedFramePath)) {
          try { fs.unlinkSync(extractedFramePath); } catch (_) {}
        }
      }
    } else {
      // 3. Photo upload -> AI 3D Reconstruction
      console.log(`[ScanController] Processing image for AI 3D reconstruction: ${req.file.originalname}`);
      try {
        const generatedGlbPath = await generate3DFromImage(tempFilePath);
        publicGlbUrl = await uploadGlbModel(generatedGlbPath, dishSlug);
      } catch (aiErr) {
        console.warn('[ScanController] AI Space busy or queue full:', aiErr.message);
        return res.status(503).json({
          success: false,
          message: `The 3D AI generator is currently busy or queued (${aiErr.message}). You can also download a .glb model from Meshy and upload it directly!`,
          error: aiErr.message
        });
      }
    }

    // Parse ingredients array
    const ingredientsList = typeof ingredients === 'string'
      ? ingredients.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Fresh Farm Ingredients', 'Artisanal Spices'];

    const numericPrice = parseInt(String(price).replace(/[^0-9]/g, '')) || 290;

    const newDish = {
      id: `custom-${dishSlug}-${Date.now().toString().slice(-4)}`,
      name,
      tagline,
      price: price.startsWith('₹') ? price : `₹${price}`,
      numericPrice,
      spiceLevel,
      spiceScore: spiceLevel.includes('🌶️🌶️') ? 3 : 1,
      rating: '5.0 ★ (New)',
      prepTime,
      calories,
      description,
      ingredients: ingredientsList,
      dietary,
      badge: '✨ 3D SCANNED',
      isARAvailable: true,
      modelUrl: publicGlbUrl,
      remoteModelUrl: publicGlbUrl,
      colorAccent: dietary === 'Vegetarian' ? '#10b981' : '#f59e0b',
      createdAt: new Date().toISOString()
    };

    // Save to persistent storage
    const customDishes = readCustomDishes();
    customDishes.unshift(newDish);
    writeCustomDishes(customDishes);

    console.log(`[ScanController] Dish successfully created: ${newDish.name} (${newDish.id})`);

    return res.status(201).json({
      success: true,
      message: '3D Dish successfully scanned and added to menu!',
      data: newDish
    });
  } catch (error) {
    console.error('[ScanController] Failed to create scanned dish:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process 3D dish scan.',
      error: error.message
    });
  } finally {
    // Clean up temporary upload file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {}
    }
  }
}

/**
 * Retrieve all user-scanned custom dishes
 */
export function getCustomDishes(req, res) {
  const dishes = readCustomDishes();
  return res.status(200).json({
    success: true,
    count: dishes.length,
    data: dishes
  });
}

/**
 * Delete a custom scanned dish
 */
export function deleteCustomDish(req, res) {
  const { id } = req.params;
  let dishes = readCustomDishes();
  const initialLength = dishes.length;
  dishes = dishes.filter((d) => d.id !== id);

  if (dishes.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Custom dish not found.' });
  }

  writeCustomDishes(dishes);
  return res.status(200).json({ success: true, message: 'Dish deleted successfully.' });
}
