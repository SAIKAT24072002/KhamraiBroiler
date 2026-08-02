const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryTransaction = require('../models/InventoryTransaction');
const AuditLog = require('../models/AuditLog');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * List products. Supports pagination, filters (category, search, range), and admin mode.
 * Endpoint: GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const { category, search, adminMode, isFeatured, isPopular } = req.query;
    let query = {};

    // Customer mode sees only active products
    if (adminMode !== 'true') {
      query.status = 'active';
    }

    // Category filter
    if (category) {
      // Could be slug or ObjectId
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          query.category = cat._id;
        } else {
          return res.status(200).json([]); // Category doesn't exist
        }
      }
    }

    // Search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
    }
    if (isPopular === 'true') {
      query.isPopular = true;
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by Slug
 * Endpoint: GET /api/products/:slug
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) {
      res.status(404);
      throw new Error('Product not found.');
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product. (Admin/Manager/Inventory staff)
 * Endpoint: POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name, category, images, description, highlights,
      unit, retailPrice, wholesalePrice, wholesaleTiers,
      stock, minOrder, maxOrder, lowStockThreshold,
      status, isFeatured, isPopular
    } = req.body;

    if (!name || !category || retailPrice === undefined || wholesalePrice === undefined) {
      res.status(400);
      throw new Error('Name, category, retail price and wholesale price are required.');
    }

    const slug = slugify(name);
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      // Return existing product for idempotent behavior
      return res.status(200).json(existingProduct);
    }

    const product = await Product.create({
      name, slug, category, images, description, highlights,
      unit: unit || 'KG',
      retailPrice, wholesalePrice, wholesaleTiers: wholesaleTiers || [],
      stock: stock || 0,
      minOrder: minOrder || 1,
      maxOrder: maxOrder || 1000,
      lowStockThreshold: lowStockThreshold || 10,
      status: status || 'active',
      isFeatured: !!isFeatured,
      isPopular: !!isPopular
    });

    // Log initial stock inventory transaction if stock > 0
    if (stock && stock > 0) {
      await InventoryTransaction.create({
        product: product._id,
        previousStock: 0,
        newStock: stock,
        quantityChanged: stock,
        type: 'IN',
        reason: 'Initial stock intake',
        updatedBy: req.user._id
      });
    }

    // Write audit log
    await AuditLog.create({
      action: 'PRODUCT_CREATED',
      performedBy: req.user._id,
      details: `Product '${product.name}' was created with stock: ${product.stock}, price: ₹${product.retailPrice}/${product.unit}`,
      targetId: product._id,
      targetModel: 'Product'
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product details. (Admin/Manager/Inventory/Sales staff)
 * Endpoint: PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const {
      name, category, images, description, highlights,
      unit, retailPrice, wholesalePrice, wholesaleTiers,
      stock, minOrder, maxOrder, lowStockThreshold,
      status, isFeatured, isPopular
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found.');
    }

    const oldStock = product.stock;
    const oldRetail = product.retailPrice;
    const oldWholesale = product.wholesalePrice;

    if (name) {
      product.name = name;
      product.slug = slugify(name);
    }
    if (category) product.category = category;
    if (images) product.images = images;
    if (description !== undefined) product.description = description;
    if (highlights) product.highlights = highlights;
    if (unit) product.unit = unit;
    if (retailPrice !== undefined) product.retailPrice = retailPrice;
    if (wholesalePrice !== undefined) product.wholesalePrice = wholesalePrice;
    if (wholesaleTiers) product.wholesaleTiers = wholesaleTiers;
    if (minOrder !== undefined) product.minOrder = minOrder;
    if (maxOrder !== undefined) product.maxOrder = maxOrder;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    if (status) product.status = status;
    if (isFeatured !== undefined) product.isFeatured = !!isFeatured;
    if (isPopular !== undefined) product.isPopular = !!isPopular;

    // Handle stock changes manually from edit product panel
    if (stock !== undefined && stock !== oldStock) {
      product.stock = stock;
      const quantityChanged = stock - oldStock;
      await InventoryTransaction.create({
        product: product._id,
        previousStock: oldStock,
        newStock: stock,
        quantityChanged: Math.abs(quantityChanged),
        type: quantityChanged > 0 ? 'IN' : 'OUT',
        reason: 'Manual edit update',
        updatedBy: req.user._id
      });
    }

    const updatedProduct = await product.save();

    // Audit logs for price changes
    if (retailPrice !== undefined && retailPrice !== oldRetail) {
      await AuditLog.create({
        action: 'PRICE_UPDATED',
        performedBy: req.user._id,
        details: `Retail price for '${product.name}' changed from ₹${oldRetail} to ₹${retailPrice}`,
        targetId: product._id,
        targetModel: 'Product'
      });
    }

    await AuditLog.create({
      action: 'PRODUCT_UPDATED',
      performedBy: req.user._id,
      details: `Product '${product.name}' details were updated.`,
      targetId: product._id,
      targetModel: 'Product'
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate an existing product as inactive copy. (Admin/Manager only)
 * Endpoint: POST /api/products/:id/duplicate
 */
const duplicateProduct = async (req, res, next) => {
  try {
    const productToCopy = await Product.findById(req.params.id);
    if (!productToCopy) {
      res.status(404);
      throw new Error('Product not found.');
    }

    const newName = `Copy of ${productToCopy.name}`;
    let suffix = 1;
    let finalName = newName;
    let finalSlug = slugify(finalName);
    
    // Ensure slug doesn't collide
    while (await Product.findOne({ slug: finalSlug })) {
      finalName = `Copy of ${productToCopy.name} (${suffix++})`;
      finalSlug = slugify(finalName);
    }

    const duplicatedProduct = await Product.create({
      name: finalName,
      slug: finalSlug,
      category: productToCopy.category,
      images: productToCopy.images,
      description: productToCopy.description,
      highlights: productToCopy.highlights,
      unit: productToCopy.unit,
      retailPrice: productToCopy.retailPrice,
      wholesalePrice: productToCopy.wholesalePrice,
      wholesaleTiers: productToCopy.wholesaleTiers,
      stock: 0, // Reset stock to 0 for duplicated product
      minOrder: productToCopy.minOrder,
      maxOrder: productToCopy.maxOrder,
      lowStockThreshold: productToCopy.lowStockThreshold,
      status: 'inactive', // Default to inactive copy
      isFeatured: false,
      isPopular: false
    });

    res.status(201).json(duplicatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product. (Admin only)
 * Endpoint: DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found.');
    }

    await Product.deleteOne({ _id: product._id });

    await AuditLog.create({
      action: 'PRODUCT_DELETED',
      performedBy: req.user._id,
      details: `Product '${product.name}' was permanently deleted.`
    });

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  duplicateProduct,
  deleteProduct
};
