import Dish from '../models/Dish.js';

/**
 * Retrieve all menu items directly from MongoDB.
 */
export const getMenu = async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ isARAvailable: -1, createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      source: 'mongodb',
      count: dishes.length,
      data: dishes
    });
  } catch (error) {
    console.error('[MenuController] Error retrieving menu from MongoDB:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu items from MongoDB database',
      error: error.message
    });
  }
};

/**
 * Retrieve a single dish by its unique string ID from MongoDB.
 */
export const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await Dish.findOne({ id }).lean();

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: `Dish with ID '${id}' not found in MongoDB database`
      });
    }

    return res.status(200).json({
      success: true,
      source: 'mongodb',
      data: dish
    });
  } catch (error) {
    console.error(`[MenuController] Error retrieving dish '${req.params.id}':`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dish from MongoDB',
      error: error.message
    });
  }
};

/**
 * Create a new dish item directly in MongoDB.
 */
export const createDish = async (req, res) => {
  try {
    const dishData = req.body;
    if (!dishData.id || !dishData.name || !dishData.price) {
      return res.status(400).json({
        success: false,
        message: 'Fields `id`, `name`, and `price` are required.'
      });
    }

    const numericPrice = parseInt(String(dishData.price).replace(/[^0-9]/g, '')) || 0;
    const newDish = await Dish.create({
      ...dishData,
      numericPrice: dishData.numericPrice || numericPrice
    });

    return res.status(201).json({
      success: true,
      message: `Dish '${newDish.name}' created in MongoDB`,
      data: newDish
    });
  } catch (error) {
    console.error('[MenuController] Error creating dish:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create dish in MongoDB',
      error: error.message
    });
  }
};

/**
 * Update an existing dish in MongoDB.
 */
export const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Dish.findOneAndUpdate(
      { id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Dish with ID '${id}' not found in database.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Dish '${updated.name}' updated in MongoDB`,
      data: updated
    });
  } catch (error) {
    console.error(`[MenuController] Error updating dish '${req.params.id}':`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update dish in MongoDB',
      error: error.message
    });
  }
};

/**
 * Delete a dish from MongoDB.
 */
export const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Dish.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Dish with ID '${id}' not found in database.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Dish '${deleted.name}' deleted from MongoDB successfully.`
    });
  } catch (error) {
    console.error(`[MenuController] Error deleting dish '${req.params.id}':`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete dish from MongoDB',
      error: error.message
    });
  }
};
