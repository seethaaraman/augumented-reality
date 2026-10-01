import Dish from '../models/Dish.js';
import Order from '../models/Order.js';

/**
 * Place a new order and persist it into MongoDB.
 */
export const createOrder = async (req, res) => {
  try {
    const { dishId, quantity = 1, specialInstructions = '', tableNumber = 'Table 4' } = req.body;

    // Verify dish exists in MongoDB
    const dish = await Dish.findOne({ id: dishId }).lean();
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: `Dish with ID '${dishId}' not found in MongoDB database.`
      });
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const numericTotal = (dish.numericPrice || 0) * Number(quantity);
    const totalAmount = `₹${numericTotal}`;

    // Create and save real order document in MongoDB
    const orderDoc = await Order.create({
      orderId,
      dishId: dish.id,
      dishName: dish.name,
      price: dish.price,
      unitPrice: dish.numericPrice,
      quantity: Number(quantity),
      totalAmount,
      numericTotal,
      specialInstructions,
      tableNumber,
      status: 'CONFIRMED'
    });

    console.log(`🧾 [MongoDB Order] New order created in DB: ${orderDoc.orderId} for ${orderDoc.dishName}`);

    return res.status(201).json({
      success: true,
      message: `Order for ${dish.name} placed successfully and stored in MongoDB!`,
      data: orderDoc
    });
  } catch (error) {
    console.error('[OrderController] Error placing order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process order in database',
      error: error.message
    });
  }
};

/**
 * Retrieve all orders from MongoDB (e.g. for Kitchen Display or order history).
 */
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      source: 'mongodb',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('[OrderController] Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders from database',
      error: error.message
    });
  }
};

/**
 * Retrieve a single order by orderId from MongoDB.
 */
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order '${orderId}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      source: 'mongodb',
      data: order
    });
  } catch (error) {
    console.error(`[OrderController] Error fetching order '${req.params.orderId}':`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
};

/**
 * Update order status in MongoDB (e.g. 'PREPARING', 'READY', 'SERVED').
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updated = await Order.findOneAndUpdate(
      { orderId },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Order '${orderId}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order '${orderId}' status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    console.error(`[OrderController] Error updating order status:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};
