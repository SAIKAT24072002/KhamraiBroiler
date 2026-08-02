const Banner = require('../models/Banner');
const AuditLog = require('../models/AuditLog');

/**
 * List homepage slideshow banners.
 * Endpoint: GET /api/banners
 */
const getBanners = async (req, res, next) => {
  try {
    const isAdminMode = req.query.adminMode === 'true';
    const filter = isAdminMode ? {} : { status: 'active' };
    const banners = await Banner.find(filter).sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    next(error);
  }
};

/**
 * Create banner. (Admin/Manager only)
 * Endpoint: POST /api/banners
 */
const createBanner = async (req, res, next) => {
  try {
    const { image, title, subtitle, buttonText, buttonLink, startDate, endDate, status } = req.body;

    if (!image) {
      res.status(400);
      throw new Error('Banner image URL is required.');
    }

    const banner = await Banner.create({
      image,
      title: title || '',
      subtitle: subtitle || '',
      buttonText: buttonText || 'Shop Now',
      buttonLink: buttonLink || '/shop',
      startDate: startDate || new Date(),
      endDate,
      status: status || 'active'
    });

    await AuditLog.create({
      action: 'BANNER_CREATED',
      performedBy: req.user._id,
      details: `Created slider banner ID: ${banner._id}`,
      targetId: banner._id,
      targetModel: 'Banner'
    });

    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
};

/**
 * Update banner details. (Admin/Manager only)
 * Endpoint: PUT /api/banners/:id
 */
const updateBanner = async (req, res, next) => {
  try {
    const { image, title, subtitle, buttonText, buttonLink, startDate, endDate, status } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      res.status(404);
      throw new Error('Banner not found.');
    }

    if (image) banner.image = image;
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (buttonText) banner.buttonText = buttonText;
    if (buttonLink) banner.buttonLink = buttonLink;
    if (startDate) banner.startDate = new Date(startDate);
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;
    if (status) banner.status = status;

    const updatedBanner = await banner.save();

    await AuditLog.create({
      action: 'BANNER_UPDATED',
      performedBy: req.user._id,
      details: `Updated details for slider banner ID: ${banner._id}`,
      targetId: banner._id,
      targetModel: 'Banner'
    });

    res.status(200).json(updatedBanner);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a banner. (Admin only)
 * Endpoint: DELETE /api/banners/:id
 */
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      throw new Error('Banner not found.');
    }

    await Banner.deleteOne({ _id: banner._id });

    await AuditLog.create({
      action: 'BANNER_DELETED',
      performedBy: req.user._id,
      details: `Permanently deleted slider banner ID: ${banner._id}`
    });

    res.status(200).json({ message: 'Banner deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
};
