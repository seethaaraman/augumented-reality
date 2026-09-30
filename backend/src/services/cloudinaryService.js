import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads a .glb 3D model file to Cloudinary.
 * @param {string|Buffer} fileSource - Local file path or Buffer of the .glb file
 * @param {string} dishId - Unique identifier for the dish (e.g. 'biryani', 'butter-chicken')
 * @returns {Promise<string>} Public HTTPS URL of the uploaded .glb model
 */
export async function uploadGlbModel(fileSource, dishId) {
  try {
    const filename = `${dishId || 'dish'}_${Date.now()}.glb`;
    console.log(`[Cloudinary] Uploading 3D model: ${filename}...`);

    const result = await cloudinary.uploader.upload(fileSource, {
      resource_type: 'raw',
      folder: 'ar_dish_models',
      public_id: filename
    });

    console.log(`[Cloudinary] Successfully uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Model upload failed:', error);
    throw error;
  }
}

/**
 * Test connectivity with Cloudinary credentials
 */
export async function testCloudinaryConnection() {
  try {
    const ping = await cloudinary.api.ping();
    return { success: true, status: ping.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default cloudinary;
