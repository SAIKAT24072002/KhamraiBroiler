const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    default: 'KHAMRAI BROILER CENTER'
  },
  tagline: {
    type: String,
    default: 'Fresh Quality. Fair Price. Trusted Service.'
  },
  description: {
    type: String,
    default: 'Premium dynamic poultry & egg distributor. We offer high quality broiler, country chickens, and fresh farm eggs at wholesale and retail rates.'
  },
  logoUrl: {
    type: String,
    default: '' // Can store base64 or Cloudinary URL
  },
  faviconUrl: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: '+91 9876543210'
  },
  whatsappNumber: {
    type: String,
    default: '9876543210' // Clean number for link generation
  },
  whatsappEnabled: {
    type: Boolean,
    default: true
  },
  whatsappDefaultMessage: {
    type: String,
    default: 'Hello! I would like to inquire about poultry products.'
  },
  email: {
    type: String,
    default: 'info@khamraibroiler.com'
  },
  storeAddress: {
    type: String,
    default: 'Station Road, Khamrai Market, Midnapore, West Bengal, India'
  },
  googleMapsUrl: {
    type: String,
    default: 'https://maps.google.com'
  },
  openingHours: {
    type: String,
    default: '07:00 AM - 09:00 PM'
  },
  closingDay: {
    type: String,
    default: 'None' // E.g., Thursday
  },
  pickupInstructions: {
    type: String,
    default: 'Please show your Order ID at the counter to verify and pickup your fresh stock.'
  },
  serviceAreaRadius: {
    type: String,
    default: '20 KM'
  },
  serviceAreaText: {
    type: String,
    default: 'Serving Customers Within Our Local Area'
  },
  currency: {
    type: String,
    default: '₹'
  },
  loyaltyPointsRatio: {
    type: Number,
    default: 100 // Rupees spent to earn 1 point
  },
  loyaltyPointsValue: {
    type: Number,
    default: 1 // 1 point = 1 rupee discount
  },
  upiId: {
    type: String,
    default: 'kbc@upi'
  },
  upiQrCodeUrl: {
    type: String,
    default: ''
  },
  enableRazorpay: {
    type: Boolean,
    default: false
  },
  enableManualUpi: {
    type: Boolean,
    default: true
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
