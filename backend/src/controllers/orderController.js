import { DISHES_DATA } from '../data/dishesData.js';

export const createOrder = (req, res) => {
  try {
    const { dishId, quantity = 1, specialInstructions = '' } = req.body;

    const dish = DISHES_DATA.find((d) => d.id === dishId);
    if (!dish) {
      return res.status(400).json({
        success: false,
        message: `Invalid dish ID: ${dishId}`
      });
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const totalAmount = dish.numericPrice * quantity;

    const orderReceipt = {
      orderId,
      status: 'CONFIRMED',
      timestamp: new Date().toISOString(),
      item: {
        id: dish.id,
        name: dish.name,
        price: dish.price,
        unitPrice: dish.numericPrice,
        quantity
      },
      specialInstructions,
      totalAmount: `₹${totalAmount}`,
      demoNote: 'This is a simulated demo order for the AR Restaurant application.'
    };

    return res.status(201).json({
      success: true,
      message: `Order for ${dish.name} received successfully!`,
      data: orderReceipt
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process order',
      error: error.message
    });
  }
};
