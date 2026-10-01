import Dish from '../models/Dish.js';
import { DISHES_DATA } from '../data/dishesData.js';

/**
 * Seeds and synchronizes core restaurant menu dishes into MongoDB Atlas.
 * Preserves all user-scanned custom dishes already in MongoDB.
 */
export async function seedDatabase() {
  try {
    let upsertedCount = 0;
    for (const dish of DISHES_DATA) {
      await Dish.findOneAndUpdate(
        { id: dish.id },
        { $set: { ...dish, isCustom: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upsertedCount++;
    }

    const totalInDb = await Dish.countDocuments();
    console.log(`🍃 [MongoDB Seed] Database synchronized: ${upsertedCount} core dishes seeded, total ${totalInDb} dishes now in DB.`);
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
