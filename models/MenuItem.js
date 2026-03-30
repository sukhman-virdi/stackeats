const mongoose = require('mongoose');

// ─── Module: MenuItem Model ───────────────────────────────────────────────
const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Item name is required'],
      trim:     true,
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },
    category: {
      type:      String,
      trim:      true,
      lowercase: true,
      default:   'general',
    },
    imageUrl: {
      type:    String,
      default: '',
    },
    available: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);