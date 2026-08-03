const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const InventoryTransaction = require('../models/InventoryTransaction');
const AuditLog = require('../models/AuditLog');
const { generateInvoiceHTML } = require('../utils/invoiceGenerator');

/**
 * Helper to generate order numbers.
 * Format: KBC-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
 */
const generateOrderNumber = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KBC-${today}-${rand}`;
};

/**
 * Checkout and create a new pickup order.
 * Endpoint: POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      name, phone, address,
      items, couponCode, useLoyaltyPoints,
      paymentMethod, transactionId, pickupDate, pickupTime, orderNote
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Order items are required.');
    }

    if (!pickupDate || !pickupTime) {
      res.status(400);
      throw new Error('Pickup date and time slot are required.');
    }

    if (!paymentMethod) {
      res.status(400);
      throw new Error('Payment method is required.');
    }

    const settings = await Settings.findOne() || {};
    const customer = await User.findById(req.user._id);

    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and calculate subtotal
    for (const cartItem of items) {
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${cartItem.name}`);
      }

      if (product.status !== 'active') {
        res.status(400);
        throw new Error(`Product is no longer available: ${product.name}`);
      }

      // Check stock
      if (product.stock < cartItem.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.name}. Available stock: ${product.stock} ${product.unit}.`);
      }

      // Determine correct unit price (check wholesale tiers)
      let price = product.retailPrice;
      const quantity = parseFloat(cartItem.quantity);

      // Check wholesale criteria
      if (quantity >= product.minOrder) {
        // Look for tier match
        let tierPrice = null;
        if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
          for (const tier of product.wholesaleTiers) {
            if (quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty)) {
              tierPrice = tier.price;
              break;
            }
          }
        }
        // Fallback to standard wholesale price if no tier matches but quantity qualifies
        price = tierPrice !== null ? tierPrice : product.wholesalePrice;
      }

      const totalItemAmount = price * quantity;
      subtotal += totalItemAmount;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity,
        unit: product.unit,
        price,
        total: totalItemAmount
      });
    }

    // Apply Coupon discount
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
      if (!coupon) {
        res.status(400);
        throw new Error('Invalid or inactive coupon code.');
      }
      
      const now = new Date();
      if (now < coupon.startDate || now > coupon.expiryDate) {
        res.status(400);
        throw new Error('Coupon code has expired.');
      }

      if (subtotal < coupon.minOrderAmount) {
        res.status(400);
        throw new Error(`Minimum purchase amount for this coupon is ₹${coupon.minOrderAmount}.`);
      }

      if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
        res.status(400);
        throw new Error('Coupon usage limit reached.');
      }

      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
      }

      // Prevent discount from exceeding subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    }

    // Apply Loyalty Points deduction
    let loyaltyPointsRedeemed = 0;
    if (useLoyaltyPoints && customer.loyaltyPoints > 0) {
      const pointsValueRatio = settings.loyaltyPointsValue || 1; // 1 point = ₹1
      const pointsAvailable = customer.loyaltyPoints;
      const maximumRedeemableAmount = subtotal - discount;
      const pointsNeeded = Math.min(pointsAvailable, maximumRedeemableAmount / pointsValueRatio);
      
      loyaltyPointsRedeemed = Math.floor(pointsNeeded);
      discount += loyaltyPointsRedeemed * pointsValueRatio;
    }

    const total = Math.max(0, subtotal - discount);

    // Calculate Loyalty Points to be earned (Ratio e.g. 1 point for every ₹100 of final payment)
    const pointsRatio = settings.loyaltyPointsRatio || 100;
    const loyaltyPointsEarned = Math.floor(total / pointsRatio);

    // Deduct stock for each item immediately upon checkout
    for (const item of validatedItems) {
      const prod = await Product.findById(item.product);
      const previousStock = prod.stock;
      prod.stock -= item.quantity;
      await prod.save();

      // Log Inventory Transaction
      await InventoryTransaction.create({
        product: item.product,
        previousStock: previousStock,
        newStock: prod.stock,
        quantityChanged: item.quantity,
        type: 'OUT',
        reason: 'Order Checkout',
        updatedBy: null // System checkout
      });
    }

    // Set Payment details based on selected gateway
    let paymentStatus = 'Pending';
    let pDetails = {};

    if (paymentMethod === 'Manual UPI') {
      if (!transactionId) {
        res.status(400);
        throw new Error('Transaction UTR ID is required for UPI payment.');
      }
      paymentStatus = 'Pending Verification';
      pDetails.transactionId = transactionId;
    }

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      guestInfo: { name, phone, address },
      items: validatedItems,
      subtotal,
      discount: discount - (loyaltyPointsRedeemed * (settings.loyaltyPointsValue || 1)),
      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      total,
      paymentMethod,
      paymentStatus,
      paymentDetails: pDetails,
      pickupDate: new Date(pickupDate),
      pickupTime,
      status: 'Pending',
      orderNote: orderNote || ''
    });

    // Update coupon counters
    if (coupon) {
      coupon.usageCount += 1;
      await coupon.save();
    }

    // Subtract redeemed loyalty points from customer model
    if (loyaltyPointsRedeemed > 0) {
      customer.loyaltyPoints -= loyaltyPointsRedeemed;
      await customer.save();
    }

    // Audit Log entry
    await AuditLog.create({
      action: 'ORDER_PLACED',
      performedBy: req.user._id,
      details: `Placed order ${order.orderNumber} for total ₹${order.total.toFixed(2)}`,
      targetId: order._id,
      targetModel: 'Order'
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Returns list of orders for the logged-in customer.
 * Endpoint: GET /api/orders/my-orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [
        { customer: req.user._id },
        { 'guestInfo.phone': req.user.mobile }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order details. Customers can view their own, Staff can view any.
 * Endpoint: GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name mobile email loyaltyPoints');
      
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    // Security check: Customer can only view their own orders
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied. You can only view your own orders.');
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Returns list of all orders. (Admin/Manager/Sales)
 * Endpoint: GET /api/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (search) {
      // Find orders matching orderNumber or customer mobile / name
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: userIds } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'name mobile')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Transitions order states & triggers business events (loyalty crediting / stock reverting).
 * Endpoint: PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400);
      throw new Error('Status is required.');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
      return res.status(200).json(order);
    }

    // Business Logic: Order Cancelled (revert stock levels)
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const prev = prod.stock;
          prod.stock += item.quantity;
          await prod.save();

          await InventoryTransaction.create({
            product: item.product,
            previousStock: prev,
            newStock: prod.stock,
            quantityChanged: item.quantity,
            type: 'IN',
            reason: `Order Cancelled (${order.orderNumber})`,
            updatedBy: req.user._id
          });
        }
      }
      
      // Return redeemed loyalty points to user
      if (order.loyaltyPointsRedeemed > 0) {
        await User.findByIdAndUpdate(order.customer, {
          $inc: { loyaltyPoints: order.loyaltyPointsRedeemed }
        });
      }
    }

    // Business Logic: Order Completed / Collected (Credit loyalty points earned)
    if ((status === 'Completed' || status === 'Collected') && 
        oldStatus !== 'Completed' && oldStatus !== 'Collected') {
      
      if (order.loyaltyPointsEarned > 0) {
        await User.findByIdAndUpdate(order.customer, {
          $inc: { loyaltyPoints: order.loyaltyPointsEarned }
        });
      }

      // If Cash on Pickup, mark payment status as Paid automatically on collection
      if (order.paymentMethod === 'Cash on Pickup' && order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'Paid';
      }
    }

    order.status = status;
    await order.save();

    // Log audit
    await AuditLog.create({
      action: 'ORDER_STATUS_CHANGED',
      performedBy: req.user._id,
      details: `Changed order ${order.orderNumber} status from '${oldStatus}' to '${status}'`,
      targetId: order._id,
      targetModel: 'Order'
    });

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Manually updates payment status (paid/unpaid). (Admin/Manager/Sales only)
 * Endpoint: PUT /api/orders/:id/payment
 */
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      res.status(400);
      throw new Error('Payment status is required.');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    await order.save();

    await AuditLog.create({
      action: 'PAYMENT_STATUS_CHANGED',
      performedBy: req.user._id,
      details: `Changed order ${order.orderNumber} payment status from '${oldPaymentStatus}' to '${paymentStatus}'`,
      targetId: order._id,
      targetModel: 'Order'
    });

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Serve HTML printable dynamic invoice for orders.
 * Endpoint: GET /api/orders/:id/invoice
 */
const printInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name mobile email');
      
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    // Security check: Customer can only print their own invoices
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied. You can only print your own invoices.');
    }

    const settings = await Settings.findOne() || {
      businessName: 'KHAMRAI BROILER CENTER',
      tagline: 'Fresh Quality. Fair Price. Trusted Service.',
      storeAddress: 'Station Road, Khamrai Market, Midnapore, West Bengal, India',
      phone: '+91 9876543210',
      whatsappNumber: '9876543210',
      pickupInstructions: 'Show invoice at counter.'
    };

    const html = generateInvoiceHTML(order, settings);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Guest checkout – create a pickup order without requiring authentication.
 * Endpoint: POST /api/orders/guest
 */
const createGuestOrder = async (req, res, next) => {
  try {
    const {
      name, phone, address,
      items, couponCode,
      paymentMethod, transactionId, pickupDate, pickupTime, orderNote
    } = req.body;

    // Basic guest info validation
    if (!name || !phone || !address) {
      res.status(400);
      throw new Error('Name, phone number and address are required.');
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      res.status(400);
      throw new Error('Phone number must be at least 10 digits.');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Order items are required.');
    }

    if (!pickupDate || !pickupTime) {
      res.status(400);
      throw new Error('Pickup date and time slot are required.');
    }

    const settings = await Settings.findOne() || {};

    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and calculate subtotal (same logic as authenticated createOrder)
    for (const cartItem of items) {
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${cartItem.name || cartItem.productId}`);
      }

      if (product.status !== 'active') {
        res.status(400);
        throw new Error(`Product is no longer available: ${product.name}`);
      }

      if (product.stock < cartItem.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.name}. Available stock: ${product.stock} ${product.unit}.`);
      }

      let price = product.retailPrice;
      const quantity = parseFloat(cartItem.quantity);

      if (quantity >= product.minOrder) {
        let tierPrice = null;
        if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
          for (const tier of product.wholesaleTiers) {
            if (quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty)) {
              tierPrice = tier.price;
              break;
            }
          }
        }
        price = tierPrice !== null ? tierPrice : product.wholesalePrice;
      }

      const totalItemAmount = price * quantity;
      subtotal += totalItemAmount;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity,
        unit: product.unit,
        price,
        total: totalItemAmount
      });
    }

    // Apply Coupon discount (if provided)
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
      if (coupon) {
        const now = new Date();
        if (now >= coupon.startDate && now <= coupon.expiryDate && subtotal >= coupon.minOrderAmount) {
          if (coupon.usageLimit <= 0 || coupon.usageCount < coupon.usageLimit) {
            if (coupon.discountType === 'percentage') {
              discount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
              }
            } else if (coupon.discountType === 'fixed') {
              discount = coupon.discountValue;
            }
            if (discount > subtotal) discount = subtotal;
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    // Deduct stock
    for (const item of validatedItems) {
      const prod = await Product.findById(item.product);
      const previousStock = prod.stock;
      prod.stock -= item.quantity;
      await prod.save();

      await InventoryTransaction.create({
        product: item.product,
        previousStock,
        newStock: prod.stock,
        quantityChanged: item.quantity,
        type: 'OUT',
        reason: 'Guest Order Checkout',
        updatedBy: null
      });
    }

    // Payment
    let paymentStatus = 'Pending';
    let pDetails = {};
    const pMethod = paymentMethod || 'Cash on Pickup';

    if (pMethod === 'Manual UPI') {
      if (!transactionId) {
        res.status(400);
        throw new Error('Transaction UTR ID is required for UPI payment.');
      }
      paymentStatus = 'Pending Verification';
      pDetails.transactionId = transactionId;
    }

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: null,
      guestInfo: { name, phone: phoneDigits, address },
      items: validatedItems,
      subtotal,
      discount,
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0,
      total,
      paymentMethod: pMethod,
      paymentStatus,
      paymentDetails: pDetails,
      pickupDate: new Date(pickupDate),
      pickupTime,
      status: 'Pending',
      orderNote: orderNote || ''
    });

    if (coupon) {
      coupon.usageCount += 1;
      await coupon.save();
    }

    // Audit
    await AuditLog.create({
      action: 'GUEST_ORDER_PLACED',
      performedBy: null,
      details: `Guest order ${order.orderNumber} placed by ${name} (${phoneDigits}) for ₹${order.total.toFixed(2)}`,
      targetId: order._id,
      targetModel: 'Order'
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by Order Number (Public endpoint for guest tracking)
 * Endpoint: GET /api/orders/tracking/:orderNumber
 */
const getGuestOrder = async (req, res, next) => {
  try {
    const orderNumber = req.params.orderNumber.toUpperCase();
    const order = await Order.findOne({ orderNumber }).populate('customer', 'name mobile');
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found with the provided Order Number.');
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  createGuestOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  printInvoice,
  getGuestOrder
};
