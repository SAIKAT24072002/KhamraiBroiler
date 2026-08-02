const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary only if keys are present
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary storage successfully initialized.');
} else {
  console.log('Cloudinary keys missing. Falling back to Local Disk Storage.');
}

/**
 * Uploads a file to Cloudinary or saves it locally if Cloudinary is not configured.
 * @param {string} localFilePath - Path to local temporary file
 * @param {string} folder - Folder name on Cloudinary/Local
 * @returns {Promise<string>} - Returns the URL of the uploaded image
 */
const uploadImage = async (localFilePath, folder = 'khamrai-broiler') => {
  try {
    if (!localFilePath) return null;

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: folder,
        resource_type: 'auto'
      });
      // Delete temporary local file
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Error deleting temporary local file:', err.message);
      }
      return result.secure_url;
    } else {
      // Move temp file to permanent local uploads
      const fileName = path.basename(localFilePath);
      const permanentFolder = path.join(__dirname, '..', 'public', 'uploads', folder);
      
      // Ensure folder exists
      if (!fs.existsSync(permanentFolder)) {
        fs.mkdirSync(permanentFolder, { recursive: true });
      }

      const permanentPath = path.join(permanentFolder, fileName);
      fs.renameSync(localFilePath, permanentPath);
      
      // Return relative web URL
      return `/uploads/${folder}/${fileName}`;
    }
  } catch (error) {
    console.error('Upload Image Error:', error.message);
    // Cleanup local temp file if it exists
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {}
    }
    throw new Error('File upload failed: ' + error.message);
  }
};

/**
 * Deletes an image from Cloudinary or from the local uploads folder.
 * @param {string} fileUrl - The full or relative URL of the image
 * @returns {Promise<boolean>}
 */
const deleteImage = async (fileUrl) => {
  try {
    if (!fileUrl) return false;

    if (isCloudinaryConfigured && fileUrl.includes('cloudinary.com')) {
      // Extract public ID from Cloudinary URL
      // Format: res.cloudinary.com/cloud-name/image/upload/v12345/folder/public_id.ext
      const parts = fileUrl.split('/upload/');
      if (parts.length > 1) {
        const pathPart = parts[1].replace(/v\d+\//, ''); // Remove version prefix
        const publicIdWithExt = pathPart;
        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
      }
      return false;
    } else if (fileUrl.startsWith('/uploads/')) {
      // Local file
      const absolutePath = path.join(__dirname, '..', 'public', fileUrl);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        return true;
      }
      return false;
    }
    return false;
  } catch (error) {
    console.error('Delete Image Error:', error.message);
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  isCloudinaryConfigured
};
