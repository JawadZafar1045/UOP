const cloudinary = require('../../../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload buffer to Cloudinary via stream.
 * @param {object} file - The file object from Multer (contains buffer, mimetype, etc)
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadFile = (file, folder = 'uop_uploads') => {
  try {
    const { validateUploadedFile } = require('../middlewares/security.middleware');
    validateUploadedFile(file);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    const originalName = file.originalname || 'file';
    const extMatch = originalName.match(/\.([^\.]+)$/);
    const ext = extMatch ? extMatch[1] : '';
    const safeName = (extMatch ? originalName.replace(`.${ext}`, '') : originalName).replace(/[^a-zA-Z0-9]/g, '_');
    
    const isImageOrVideo = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf';
    const uniqueId = `${safeName}_${Date.now()}`;
    
    // For raw files (not images, videos, or PDFs), Cloudinary requires the extension in the public_id
    const publicId = (!isImageOrVideo && ext) ? `${uniqueId}.${ext}` : uniqueId;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isImageOrVideo ? 'auto' : 'raw',
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          console.error('[FileService] Cloudinary Upload Error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

/**
 * Delete a file from Cloudinary.
 * @param {string} publicId - The public ID of the resource
 * @param {string} resourceType - 'image' or 'raw'
 */
const deleteFile = async (publicId, resourceType = 'raw') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('[FileService] Cloudinary Delete Error:', error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile
};
