const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

/**
 * Returns dynamic business settings (branding, contact, upi, hours).
 * Endpoint: GET /api/settings
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Seed default settings document
      settings = await Settings.create({
        businessName: 'KHAMRAI BROILER CENTER',
        tagline: 'Fresh Quality. Fair Price. Trusted Service.',
        description: 'Premium dynamic poultry & egg distributor. We offer high quality broiler, country chickens, and fresh farm eggs at wholesale and retail rates.',
        logoUrl: '',
        faviconUrl: '',
        phone: '+91 9876543210',
        whatsappNumber: '9876543210',
        whatsappEnabled: true,
        whatsappDefaultMessage: 'Hello! I would like to inquire about poultry products.',
        email: 'info@khamraibroiler.com',
        storeAddress: 'Station Road, Khamrai Market, Midnapore, West Bengal, India',
        googleMapsUrl: 'https://maps.google.com',
        openingHours: '07:00 AM - 09:00 PM',
        closingDay: 'None',
        pickupInstructions: 'Please show your Order ID at the counter to verify and pickup your fresh stock.',
        currency: '₹',
        loyaltyPointsRatio: 100,
        loyaltyPointsValue: 1,
        upiId: 'kbc@upi',
        upiQrCodeUrl: '',
        enableRazorpay: false,
        enableManualUpi: true
      });
      console.log('[SEED] Created default business settings.');
    }
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Update business configuration/branding. (Admin only)
 * Endpoint: PUT /api/settings
 */
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const {
      businessName, tagline, description, logoUrl, faviconUrl,
      phone, whatsappNumber, whatsappEnabled, whatsappDefaultMessage,
      email, storeAddress, googleMapsUrl, openingHours, closingDay,
      pickupInstructions, currency, loyaltyPointsRatio, loyaltyPointsValue,
      upiId, upiQrCodeUrl, enableRazorpay, enableManualUpi, socialLinks
    } = req.body;

    if (businessName) settings.businessName = businessName;
    if (tagline) settings.tagline = tagline;
    if (description) settings.description = description;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;
    if (phone) settings.phone = phone;
    if (whatsappNumber) settings.whatsappNumber = whatsappNumber;
    if (whatsappEnabled !== undefined) settings.whatsappEnabled = !!whatsappEnabled;
    if (whatsappDefaultMessage !== undefined) settings.whatsappDefaultMessage = whatsappDefaultMessage;
    if (email) settings.email = email;
    if (storeAddress) settings.storeAddress = storeAddress;
    if (googleMapsUrl) settings.googleMapsUrl = googleMapsUrl;
    if (openingHours) settings.openingHours = openingHours;
    if (closingDay) settings.closingDay = closingDay;
    if (pickupInstructions) settings.pickupInstructions = pickupInstructions;
    if (currency) settings.currency = currency;
    if (loyaltyPointsRatio !== undefined) settings.loyaltyPointsRatio = Number(loyaltyPointsRatio);
    if (loyaltyPointsValue !== undefined) settings.loyaltyPointsValue = Number(loyaltyPointsValue);
    if (upiId) settings.upiId = upiId;
    if (upiQrCodeUrl !== undefined) settings.upiQrCodeUrl = upiQrCodeUrl;
    if (enableRazorpay !== undefined) settings.enableRazorpay = !!enableRazorpay;
    if (enableManualUpi !== undefined) settings.enableManualUpi = !!enableManualUpi;
    if (socialLinks) settings.socialLinks = { ...settings.socialLinks, ...socialLinks };

    const updatedSettings = await settings.save();

    await AuditLog.create({
      action: 'SETTINGS_UPDATED',
      performedBy: req.user._id,
      details: 'Updated business branding and settings details.'
    });

    res.status(200).json(updatedSettings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
