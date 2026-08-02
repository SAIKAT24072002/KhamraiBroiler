const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const AuditLog = require('../models/AuditLog');

/**
 * Adjust stock levels for a product manually.
 * Endpoint: POST /api/inventory/adjust
 */
const adjustStock = async (req, res, next) => {
  try {
    const { productId, quantity, type, reason } = req.body; // type: 'IN', 'OUT', 'ADJUST' (override)

    if (!productId || quantity === undefined || !type) {
      res.status(400);
      throw new Error('Product ID, quantity and adjustment type (IN/OUT/ADJUST) are required.');
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found.');
    }

    const previousStock = product.stock;
    let newStock = previousStock;
    const parsedQty = Math.abs(parseInt(quantity));

    if (type === 'IN') {
      newStock += parsedQty;
    } else if (type === 'OUT') {
      if (previousStock < parsedQty) {
        res.status(400);
        throw new Error(`Insufficient stock. Current stock is ${previousStock}, cannot deduct ${parsedQty}.`);
      }
      newStock -= parsedQty;
    } else if (type === 'ADJUST') {
      newStock = parsedQty; // Direct override
    } else {
      res.status(400);
      throw new Error('Invalid adjustment type. Must be IN, OUT, or ADJUST.');
    }

    product.stock = newStock;
    await product.save();

    // Create Transaction Record
    const transaction = await InventoryTransaction.create({
      product: productId,
      previousStock,
      newStock,
      quantityChanged: type === 'ADJUST' ? Math.abs(newStock - previousStock) : parsedQty,
      type,
      reason: reason || 'Manual stock update',
      updatedBy: req.user._id
    });

    // Audit Log entry
    await AuditLog.create({
      action: 'STOCK_ADJUSTED',
      performedBy: req.user._id,
      details: `Adjusted '${product.name}' Stock: ${previousStock} ➔ ${newStock} (${type} by ${parsedQty} units). Reason: ${reason || 'None'}`,
      targetId: product._id,
      targetModel: 'Product'
    });

    res.status(200).json({
      success: true,
      message: `Stock adjusted successfully. Current stock is: ${newStock}.`,
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock
      },
      transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns inventory transaction history.
 * Endpoint: GET /api/inventory/transactions
 */
const getInventoryTransactions = async (req, res, next) => {
  try {
    const { productId } = req.query;
    let query = {};
    if (productId) {
      query.product = productId;
    }

    const transactions = await InventoryTransaction.find(query)
      .populate('product', 'name slug unit')
      .populate('updatedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches products that have stock less than or equal to their low stock threshold.
 * Endpoint: GET /api/inventory/low-stock
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    // Find products where stock is <= lowStockThreshold and status is active
    const products = await Product.find({
      status: 'active',
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).populate('category', 'name slug');

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adjustStock,
  getInventoryTransactions,
  getLowStockProducts
};
