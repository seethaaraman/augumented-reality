import mongoose from 'mongoose';

const DishSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    tagline: {
      type: String,
      default: ''
    },
    price: {
      type: String,
      required: true
    },
    numericPrice: {
      type: Number,
      required: true
    },
    spiceLevel: {
      type: String,
      default: '🌶️ Mild Spice'
    },
    spiceScore: {
      type: Number,
      default: 0
    },
    rating: {
      type: String,
      default: '5.0 ★ (New)'
    },
    prepTime: {
      type: String,
      default: '15 mins'
    },
    calories: {
      type: String,
      default: '400 kcal'
    },
    description: {
      type: String,
      default: ''
    },
    ingredients: {
      type: [String],
      default: []
    },
    dietary: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
      default: 'Vegetarian'
    },
    badge: {
      type: String,
      default: ''
    },
    isARAvailable: {
      type: Boolean,
      default: false
    },
    modelUrl: {
      type: String,
      default: ''
    },
    remoteModelUrl: {
      type: String,
      default: ''
    },
    colorAccent: {
      type: String,
      default: '#f59e0b'
    },
    isCustom: {
      type: Boolean,
      default: false
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

export const Dish = mongoose.models.Dish || mongoose.model('Dish', DishSchema);
export default Dish;
