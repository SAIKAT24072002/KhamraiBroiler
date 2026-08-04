const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');

/**
 * List all coupons. (Admin/Manager/Sales)
 * Endpoint: GET /api/coupons
 */
const getCoupons = async (req, res, next) => {
  try {
    const isAdminMode = req.query.adminMode === 'true';
    const now = new Date();
    // Start of today so coupons expiring today remain visible throughout the day
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const filter = isAdminMode ? {} : { status: 'active', expiryDate: { $gte: startOfToday } };
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    next(error);
  }
};

/**
 * Validates a coupon code against a specific subtotal amount.
 * Endpoint: POST /api/coupons/validate
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    if (!code || amount === undefined) {
      res.status(400);
      throw new Error('Coupon code and cart subtotal amount are required.');
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!coupon) {
      res.status(400);
      throw new Error('Invalid or inactive coupon code.');
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.expiryDate) {
      res.status(400);
      throw new Error('Coupon code has expired.');
    }

    const subtotal = parseFloat(amount);
    if (subtotal < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(`Minimum purchase amount for this coupon is ₹${coupon.minOrderAmount}.`);
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      res.status(400);
      throw new Error('Coupon usage limit reached.');
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'fixed') {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.min(discount, subtotal),
      message: `Coupon '${coupon.code}' applied successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new coupon. (Admin/Manager only)
 * Endpoint: POST /api/coupons
 */
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, expiryDate, usageLimit, status } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      res.status(400);
      throw new Error('Code, discount type, value and expiry date are required.');
    }

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      res.status(400);
      throw new Error('Coupon code already exists.');
    }

    // Ensure expiryDate is set to end of day (23:59:59.999) if YYYY-MM-DD format
    let parsedExpiry = new Date(expiryDate);
    if (typeof expiryDate === 'string' && expiryDate.length <= 10) {
      parsedExpiry = new Date(`${expiryDate}T23:59:59.999Z`);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: parsedExpiry,
      usageLimit: usageLimit || 0,
      status: status || 'active'
    });

    await AuditLog.create({
      action: 'COUPON_CREATED',
      performedBy: req.user._id,
      details: `Created coupon code ${coupon.code} (${coupon.discountType}: ${coupon.discountValue})`,
      targetId: coupon._id,
      targetModel: 'Coupon'
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing coupon. (Admin/Manager only)
 * Endpoint: PUT /api/coupons/:id
 */
const updateCoupon = async (req, res, next) => {
  try {
    const { discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, expiryDate, usageLimit, status } = req.body;
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      res.status(404);
      throw new Error('Coupon not found.');
    }

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (startDate) coupon.startDate = new Date(startDate);
    if (expiryDate) {
      let parsedExpiry = new Date(expiryDate);
      if (typeof expiryDate === 'string' && expiryDate.length <= 10) {
        parsedExpiry = new Date(`${expiryDate}T23:59:59.999Z`);
      }
      coupon.expiryDate = parsedExpiry;
    }
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (status) coupon.status = status;

    const updatedCoupon = await coupon.save();

    await AuditLog.create({
      action: 'COUPON_UPDATED',
      performedBy: req.user._id,
      details: `Updated details for coupon ${coupon.code}`,
      targetId: coupon._id,
      targetModel: 'Coupon'
    });

    res.status(200).json(updatedCoupon);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a coupon. (Admin only)
 * Endpoint: DELETE /api/coupons/:id
 */
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error('Coupon not found.');
    }

    await Coupon.deleteOne({ _id: coupon._id });

    await AuditLog.create({
      action: 'COUPON_DELETED',
      performedBy: req.user._id,
      details: `Permanently deleted coupon code ${coupon.code}`
    });

    res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
