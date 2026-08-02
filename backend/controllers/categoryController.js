const Category = require('../models/Category');
const Product = require('../models/Product');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

/**
 * Get all categories. Customers get active ones, staff get all.
 * Endpoint: GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const isAdminMode = req.query.adminMode === 'true';
    const filter = isAdminMode ? {} : { status: 'active' };
    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single category by slug.
 * Endpoint: GET /api/categories/:slug
 */
const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      res.status(404);
      throw new Error('Category not found.');
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category. (Admin/Manager only)
 * Endpoint: POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, image, status } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('Category name is required.');
    }

    const slug = slugify(name);
    // Check if category already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      // Return the existing category (idempotent behavior)
      return res.status(200).json(existingCategory);
    }

    const category = await Category.create({
      name,
      slug,
      image: image || '',
      status: status || 'active'
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Update category details. (Admin/Manager only)
 * Endpoint: PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, image, status } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found.');
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (image !== undefined) category.image = image;
    if (status) category.status = status;

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category. (Admin only)
 * Endpoint: DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found.');
    }

    // Check if category has linked products
    const linkedProducts = await Product.countDocuments({ category: category._id });
    if (linkedProducts > 0) {
      res.status(400);
      throw new Error(`Cannot delete category. It is linked to ${linkedProducts} products. Deactivate it instead.`);
    }

    await Category.deleteOne({ _id: category._id });
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
