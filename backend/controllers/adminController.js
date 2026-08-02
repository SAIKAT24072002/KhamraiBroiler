const { uploadImage } = require('../config/cloudinary');

/**
 * Handles single image upload for products, banners, category and logo.
 * Endpoint: POST /api/admin/upload
 */
const uploadSingleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please select an image file to upload.');
    }

    const folder = req.body.folder || 'misc';
    const imageUrl = await uploadImage(req.file.path, folder);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      url: imageUrl
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingleFile
};
