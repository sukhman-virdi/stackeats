const mongoose = require('mongoose');

// ─── Module: Order Model ──────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name:       { type: String,  required: true },
    price:      { type: Number,  required: true },
    quantity:   { type: Number,  required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Order must belong to a user'],
    },
    items: {
      type:     [orderItemSchema],
      validate: { validator: arr => arr.length > 0, message: 'Order must have at least one item' },
    },
    total:           { type: Number,  required: true, min: 0 },
    status:          { type: String,  enum: ['pending','confirmed','preparing','ready','delivered','cancelled'], default: 'pending' },
    deliveryAddress: { type: String,  default: '' },
    deliveryCoords:  {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);