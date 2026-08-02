const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

/**
 * Submit customer feedback / product review.
 * Endpoint: POST /api/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const { rating, comment, productId } = req.body;

    if (!rating || !comment) {
      res.status(400);
      throw new Error('Rating (1-5) and comment are required.');
    }

    const review = await Review.create({
      rating: parseInt(rating),
      comment,
      product: productId || null,
      customer: req.user._id,
      status: 'Pending' // Requires admin approval by default
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! It will be published after review.',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get approved reviews for homepage or target product.
 * Endpoint: GET /api/reviews
 */
const getReviews = async (req, res, next) => {
  try {
    const { productId, adminMode } = req.query;
    let query = {};

    if (adminMode === 'true') {
      // Admin sees all reviews
    } else {
      query.status = 'Approved';
    }

    if (productId) {
      query.product = productId;
    }

    const reviews = await Review.find(query)
      .populate('customer', 'name role')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * Approves or rejects reviews. (Admin/Manager only)
 * Endpoint: PUT /api/reviews/:id/status
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // Approved / Rejected
    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      res.status(400);
      throw new Error('Valid review status (Approved/Rejected/Pending) is required.');
    }

    const review = await Review.findById(req.params.id).populate('customer', 'name');
    if (!review) {
      res.status(404);
      throw new Error('Review not found.');
    }

    const oldStatus = review.status;
    review.status = status;
    await review.save();

    await AuditLog.create({
      action: 'REVIEW_STATUS_CHANGED',
      performedBy: req.user._id,
      details: `Changed review by '${review.customer.name}' from '${oldStatus}' to '${status}'`,
      targetId: review._id,
      targetModel: 'Review'
    });

    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review. (Admin only)
 * Endpoint: DELETE /api/reviews/:id
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error('Review not found.');
    }

    await Review.deleteOne({ _id: review._id });
    res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviews,
  updateReviewStatus,
  deleteReview
};
