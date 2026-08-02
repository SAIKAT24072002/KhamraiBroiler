const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  oldRetailPrice: {
    type: Number,
    required: true
  },
  newRetailPrice: {
    type: Number,
    required: true
  },
  oldWholesalePrice: {
    type: Number,
    required: true
  },
  newWholesalePrice: {
    type: Number,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);
