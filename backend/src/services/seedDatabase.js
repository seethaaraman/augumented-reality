import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Dish from '../models/Dish.js';
import { DISHES_DATA } from '../data/dishesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CUSTOM_DISHES_PATH = path.resolve(__dirname, '../data/customDishes.json');

/**
 * Reads any previously scanned custom dishes from JSON to migrate into MongoDB
 */
function getLegacyCustomDishes() {
  try {
    if (fs.existsSync(CUSTOM_DISHES_PATH)) {
      const raw = fs.readFileSync(CUSTOM_DISHES_PATH, 'utf8');
      const items = JSON.parse(raw || '[]');
      return items.map((item) => ({
        ...item,
        isCustom: true
      }));
    }
  } catch (err) {
    console.warn('[Seed] Error reading legacy custom dishes:', err.message);
  }
  return [];
}

/**
 * Seeds and synchronizes all dishes into MongoDB.
 * Uses upsert so existing data and custom scanned dishes are preserved.
 */
export async function seedDatabase() {
  try {
    const legacyCustomDishes = getLegacyCustomDishes();
    const allInitialDishes = [...DISHES_DATA.map((d) => ({ ...d, isCustom: false })), ...legacyCustomDishes];

    let upsertedCount = 0;
    for (const dish of allInitialDishes) {
      await Dish.findOneAndUpdate(
        { id: dish.id },
        { $set: dish },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upsertedCount++;
    }

    const totalInDb = await Dish.countDocuments();
    console.log(`🍃 [MongoDB Seed] Database synchronized: ${upsertedCount} dishes processed, total ${totalInDb} dishes now in DB.`);
    return totalInDb;
  } catch (err) {
    console.error('❌ [MongoDB Seed] Failed to seed database:', err);
    throw err;
  }
}

/**
 * Automatically seeds the database on startup if the collection is empty.
 */
export async function seedDatabaseIfEmpty() {
  try {
    const count = await Dish.countDocuments();
    if (count === 0) {
      console.log('🍃 [MongoDB] Dish collection is empty. Seeding initial dishes into MongoDB...');
      await seedDatabase();
    } else {
      console.log(`🍃 [MongoDB] Connected to database with ${count} existing dishes in collection.`);
    }
  } catch (err) {
    console.error('❌ [MongoDB] Error checking/seeding database:', err);
  }
}
