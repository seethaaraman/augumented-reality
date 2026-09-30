import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DISHES_DATA } from '../data/dishesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CUSTOM_DISHES_PATH = path.resolve(__dirname, '../data/customDishes.json');

function getAllDishes() {
  try {
    if (fs.existsSync(CUSTOM_DISHES_PATH)) {
      const raw = fs.readFileSync(CUSTOM_DISHES_PATH, 'utf8');
      const customDishes = JSON.parse(raw || '[]');
      return [...customDishes, ...DISHES_DATA];
    }
  } catch (err) {
    console.error('[MenuController] Error loading custom dishes:', err);
  }
  return DISHES_DATA;
}

export const getMenu = (req, res) => {
  try {
    const allDishes = getAllDishes();
    return res.status(200).json({
      success: true,
      count: allDishes.length,
      data: allDishes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu items',
      error: error.message
    });
  }
};

export const getDishById = (req, res) => {
  try {
    const { id } = req.params;
    const allDishes = getAllDishes();
    const dish = allDishes.find((d) => d.id === id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: `Dish with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: dish
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dish',
      error: error.message
    });
  }
};
