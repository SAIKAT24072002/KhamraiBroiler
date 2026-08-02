const mongoose = require('mongoose');

const WholesaleTierSchema = new mongoose.Schema({
  minQty: { type: Number, required: true },
  maxQty: { type: Number }, // Optional, null or large number means upper limit
  price: { type: Number, required: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  },
  highlights: {
    type: [String],
    default: []
  },
  unit: {
    type: String,
    enum: ['KG', 'Gram', 'Piece', 'Dozen', 'Tray', 'Custom'],
    default: 'KG'
  },
  retailPrice: {
    type: Number,
    required: true,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    required: true,
    min: 0
  },
  wholesaleTiers: {
    type: [WholesaleTierSchema],
    default: []
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  minOrder: {
    type: Number,
    default: 1,
    min: 1
  },
  maxOrder: {
    type: Number,
    default: 1000
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPopular: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
