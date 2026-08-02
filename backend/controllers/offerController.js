const Offer = require('../models/Offer');
const AuditLog = require('../models/AuditLog');

/**
 * List active offers for customers or all offers for admins.
 * Endpoint: GET /api/offers
 */
const getOffers = async (req, res, next) => {
  try {
    const isAdminMode = req.query.adminMode === 'true';
    const filter = isAdminMode ? {} : { status: 'active' };
    const offers = await Offer.find(filter)
      .populate('productScope', 'name slug')
      .populate('categoryScope', 'name slug')
      .sort({ createdAt: -1 });
    res.status(200).json(offers);
  } catch (error) {
    next(error);
  }
};

/**
 * Create offer campaign. (Admin/Manager only)
 * Endpoint: POST /api/offers
 */
const createOffer = async (req, res, next) => {
  try {
    const { title, description, image, discountPercentage, startDate, endDate, productScope, categoryScope, status } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Offer title is required.');
    }

    const offer = await Offer.create({
      title,
      description: description || '',
      image: image || '',
      discountPercentage,
      startDate: startDate || new Date(),
      endDate,
      productScope: productScope || null,
      categoryScope: categoryScope || null,
      status: status || 'active'
    });

    await AuditLog.create({
      action: 'OFFER_CREATED',
      performedBy: req.user._id,
      details: `Created offer campaign '${offer.title}'`,
      targetId: offer._id,
      targetModel: 'Offer'
    });

    res.status(201).json(offer);
  } catch (error) {
    next(error);
  }
};

/**
 * Update offer campaign. (Admin/Manager only)
 * Endpoint: PUT /api/offers/:id
 */
const updateOffer = async (req, res, next) => {
  try {
    const { title, description, image, discountPercentage, startDate, endDate, productScope, categoryScope, status } = req.body;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      res.status(404);
      throw new Error('Offer not found.');
    }

    if (title) offer.title = title;
    if (description !== undefined) offer.description = description;
    if (image !== undefined) offer.image = image;
    if (discountPercentage !== undefined) offer.discountPercentage = discountPercentage;
    if (startDate) offer.startDate = new Date(startDate);
    if (endDate !== undefined) offer.endDate = endDate ? new Date(endDate) : null;
    if (productScope !== undefined) offer.productScope = productScope || null;
    if (categoryScope !== undefined) offer.categoryScope = categoryScope || null;
    if (status) offer.status = status;

    const updatedOffer = await offer.save();

    await AuditLog.create({
      action: 'OFFER_UPDATED',
      performedBy: req.user._id,
      details: `Updated campaign details for '${offer.title}'`,
      targetId: offer._id,
      targetModel: 'Offer'
    });

    res.status(200).json(updatedOffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an offer campaign. (Admin only)
 * Endpoint: DELETE /api/offers/:id
 */
const deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found.');
    }

    await Offer.deleteOne({ _id: offer._id });

    await AuditLog.create({
      action: 'OFFER_DELETED',
      performedBy: req.user._id,
      details: `Permanently deleted offer campaign '${offer.title}'`
    });

    res.status(200).json({ message: 'Offer deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
