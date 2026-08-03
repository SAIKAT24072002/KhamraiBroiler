const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

// Initialize Razorpay client only if keys exist
const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return null;
};

/**
 * Creates a Razorpay order details. If credentials are missing, falls back to a sandbox simulated order.
 * Endpoint: POST /api/payments/create-order
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400);
      throw new Error('Order ID is required.');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(order.total * 100);

    if (!razorpay) {
      // Sandbox Simulated Mode
      console.log(`[PAYMENT SIMULATION] Creating sandbox payment for order: ${order.orderNumber}`);
      
      const simulatedRazorpayOrderId = `razorpay_sim_${Date.now()}`;
      
      // Save simulated order ID in order record
      order.paymentDetails.razorpayOrderId = simulatedRazorpayOrderId;
      await order.save();

      return res.status(200).json({
        success: true,
        simulated: true,
        key: 'sandbox_key',
        amount: amountInPaise,
        currency: 'INR',
        id: simulatedRazorpayOrderId,
        orderNumber: order.orderNumber
      });
    }

    // Create real Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString()
      }
    };

    const rpOrder = await razorpay.orders.create(options);
    
    order.paymentDetails.razorpayOrderId = rpOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      simulated: false,
      key: process.env.RAZORPAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      id: rpOrder.id,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies the Razorpay payment signature sent back by the frontend checkout.
 * Endpoint: POST /api/payments/verify-signature
 */
const verifyPaymentSignature = async (req, res, next) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, isSimulated } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    if (isSimulated || !getRazorpayInstance()) {
      // Verify simulated checkout immediately
      console.log(`[PAYMENT SIMULATION] Verifying sandbox payment signature for order: ${order.orderNumber}`);
      
      order.paymentStatus = 'Paid';
      order.paymentDetails.razorpayPaymentId = razorpayPaymentId || `pay_sim_${Date.now()}`;
      await order.save();

      await AuditLog.create({
        action: 'PAYMENT_VERIFIED',
        performedBy: null,
        details: `Simulated Sandbox Payment verified for order ${order.orderNumber}`,
        targetId: order._id,
        targetModel: 'Order'
      });

      return res.status(200).json({
        success: true,
        message: 'Sandbox payment verified successfully.'
      });
    }

    // Verify real signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest === razorpaySignature) {
      order.paymentStatus = 'Paid';
      order.paymentDetails.razorpayPaymentId = razorpayPaymentId;
      order.paymentDetails.razorpaySignature = razorpaySignature;
      await order.save();

      await AuditLog.create({
        action: 'PAYMENT_VERIFIED',
        performedBy: null,
        details: `Razorpay Payment verified for order ${order.orderNumber}. Payment ID: ${razorpayPaymentId}`,
        targetId: order._id,
        targetModel: 'Order'
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified and captured successfully.'
      });
    } else {
      order.paymentStatus = 'Failed';
      await order.save();
      res.status(400).json({
        success: false,
        message: 'Invalid signature. Payment verification failed.'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Handle incoming webhooks from Razorpay for async payment notifications.
 * Endpoint: POST /api/payments/webhook
 */
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(200).send('Webhook secret not set. Skipping.');
    }

    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature === expectedSignature) {
      const event = req.body.event;
      if (event === 'payment.captured') {
        const payment = req.body.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        
        const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': razorpayOrderId });
        if (order && order.paymentStatus !== 'Paid') {
          order.paymentStatus = 'Paid';
          order.paymentDetails.razorpayPaymentId = payment.id;
          await order.save();

          console.log(`[WEBHOOK] Async Razorpay Payment captured for order: ${order.orderNumber}`);
        }
      }
      res.status(200).send('OK');
    } else {
      res.status(400).send('Invalid webhook signature');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  handleRazorpayWebhook
};
