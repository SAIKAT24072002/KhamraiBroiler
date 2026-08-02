const mongoose = require('mongoose');

const WholesaleItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'KG' }
}, { _id: false });

const WholesaleEnquirySchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  items: {
    type: [WholesaleItemSchema],
    required: true
  },
  requiredDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('WholesaleEnquiry', WholesaleEnquirySchema);
