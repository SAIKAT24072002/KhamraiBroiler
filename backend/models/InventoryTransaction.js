const mongoose = require('mongoose');

const InventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  quantityChanged: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUST'],
    required: true
  },
  reason: {
    type: String,
    default: 'Manual adjust' // E.g., 'Order checkout', 'Stock update', 'Spoilage'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Null if updated automatically by system checkout
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
