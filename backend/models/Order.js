const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [OrderItemSchema],
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Pickup', 'Manual UPI', 'Automatic Payment (Razorpay)'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Pending Verification', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentDetails: {
    transactionId: { type: String, default: '' }, // For Manual UPI (UTR Number)
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' }
  },
  pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String, // E.g., '10:00 AM - 11:00 AM'
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Collected', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  orderNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
