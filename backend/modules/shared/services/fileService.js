const cloudinary = require('../../../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload buffer to Cloudinary via stream.
 * @param {object} file - The file object from Multer (contains buffer, mimetype, etc)
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadFile = (file, folder = 'uop_uploads') => {
  return new Promise((resolve, reject) => {
    // We treat all uploads as raw/auto, or use auto for pdf/images
    const isImage = file.mimetype.startsWith('image/');
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isImage ? 'image' : 'raw', // Cloudinary treats PDFs and docs as 'raw' usually
        use_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('[FileService] Cloudinary Upload Error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
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
