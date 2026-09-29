import { DISHES_DATA } from '../data/dishesData.js';

export const getMenu = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: DISHES_DATA.length,
      data: DISHES_DATA
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
    const dish = DISHES_DATA.find((d) => d.id === id);

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
