import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    dishId: {
      type: String,
      required: true,
      index: true
    },
    dishName: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    totalAmount: {
      type: String,
      required: true
    },
    numericTotal: {
      type: Number,
      default: 0
    },
    specialInstructions: {
      type: String,
      default: ''
    },
    tableNumber: {
      type: String,
      default: 'Table 4'
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
      default: 'CONFIRMED'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;
