const MediaProviderInterface = require('./mediaProvider.interface');
const cloudinary = require('../../../../../config/cloudinary');
const streamifier = require('streamifier');

class CloudinaryProvider extends MediaProviderInterface {
  constructor() {
    super();
    this.name = 'cloudinary';
  }

  /**
   * Upload video to Cloudinary via stream.
   */
  async uploadVideo(file, options = {}) {
    return new Promise((resolve, reject) => {
      const folder = options.folder || 'cszone_lectures';
      const originalName = file.originalname || 'lecture_video';
      const safeName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicId = `${safeName}_${Date.now()}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
          public_id: publicId,
          chunk_size: 6000000, // 6MB chunks
          eager: [
            { format: 'mp4', video_codec: 'h264' }
          ],
          eager_async: false,
        },
        (error, result) => {
          if (error) {
            console.error('[CloudinaryProvider] Video Upload Error:', error);
            return reject(error);
          }

          const duration = Math.round(result.duration || 0);
          const thumbnailUrl = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            start_offset: '1',
            transformation: [{ width: 640, crop: 'scale' }]
          });

          resolve({
            provider: 'cloudinary',
            assetId: result.asset_id || result.public_id,
            publicId: result.public_id,
            playbackUrl: result.secure_url,
            thumbnailUrl,
            duration,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        }
      );

      const buffer = file.buffer;
      if (!buffer) {
        return reject(new Error('File buffer is empty'));
      }
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete video from Cloudinary.
   */
  async deleteVideo(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        invalidate: true,
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('[CloudinaryProvider] Delete Error:', error);
      throw error;
    }
  }

  /**
   * Fetch video metadata.
   */
  async getVideoMetadata(publicId) {
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: 'video',
        image_metadata: true,
      });
      return {
        publicId: resource.public_id,
        duration: Math.round(resource.duration || 0),
        format: resource.format,
        bytes: resource.bytes,
        width: resource.width,
        height: resource.height,
      };
    } catch (error) {
      console.error('[CloudinaryProvider] Get Metadata Error:', error);
      throw error;
    }
  }

  /**
   * Generate playback URL (can include signed token or optimized delivery).
   */
  async generatePlaybackUrl(publicId, options = {}) {
    // Generate secure Cloudinary URL
    const url = cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      flags: 'attachment:false',
      transformation: options.transformation || []
    });

    const thumbnailUrl = this.generateThumbnail(publicId);

    return {
      playbackUrl: url,
      thumbnailUrl,
      publicId,
      provider: 'cloudinary'
    };
  }

  /**
   * Generate thumbnail URL for a video.
   */
  generateThumbnail(publicId) {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      start_offset: '1',
      transformation: [{ width: 640, crop: 'scale' }]
    });
  }
}

module.exports = CloudinaryProvider;
