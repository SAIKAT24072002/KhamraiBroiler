const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const AuditLog = require('../models/AuditLog');

/**
 * Updates daily prices for multiple products at once and logs history.
 * Endpoint: POST /api/prices/update
 */
const updateDailyPrices = async (req, res, next) => {
  try {
    const { prices } = req.body; // Array of { productId, retailPrice, wholesalePrice }
    if (!prices || !Array.isArray(prices)) {
      res.status(400);
      throw new Error('Prices array is required.');
    }

    const updatedRecords = [];

    for (const update of prices) {
      const { productId, retailPrice, wholesalePrice } = update;
      if (!productId || retailPrice === undefined || wholesalePrice === undefined) {
        continue; // Skip invalid entries
      }

      const product = await Product.findById(productId);
      if (!product) continue;

      const oldRetailPrice = product.retailPrice;
      const oldWholesalePrice = product.wholesalePrice;
      
      const parsedRetail = parseFloat(retailPrice);
      const parsedWholesale = parseFloat(wholesalePrice);

      // Check if price has actually changed
      if (oldRetailPrice !== parsedRetail || oldWholesalePrice !== parsedWholesale) {
        product.retailPrice = parsedRetail;
        product.wholesalePrice = parsedWholesale;
        await product.save();

        // Create Price History Record
        const historyRecord = await PriceHistory.create({
          product: productId,
          oldRetailPrice,
          newRetailPrice: parsedRetail,
          oldWholesalePrice,
          newWholesalePrice: parsedWholesale,
          updatedBy: req.user._id
        });

        // Add Audit Log entry
        await AuditLog.create({
          action: 'PRICE_UPDATED',
          performedBy: req.user._id,
          details: `Updated '${product.name}' Prices - Retail: ₹${oldRetailPrice} ➔ ₹${parsedRetail}, Wholesale: ₹${oldWholesalePrice} ➔ ₹${parsedWholesale}`,
          targetId: product._id,
          targetModel: 'Product'
        });

        updatedRecords.push({
          productId,
          name: product.name,
          retailPrice: parsedRetail,
          wholesalePrice: parsedWholesale,
          historyRecord
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated pricing for ${updatedRecords.length} products.`,
      updated: updatedRecords
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns complete price update audit history.
 * Endpoint: GET /api/prices/history
 */
const getPriceHistory = async (req, res, next) => {
  try {
    const { productId } = req.query;
    let query = {};
    if (productId) {
      query.product = productId;
    }

    const history = await PriceHistory.find(query)
      .populate('product', 'name slug unit')
      .populate('updatedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateDailyPrices,
  getPriceHistory
};
