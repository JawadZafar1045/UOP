/**
 * Media Provider Interface
 * All storage providers (Cloudinary, AWS S3, Cloudflare Stream, VPS) must implement this interface.
 */
class MediaProviderInterface {
  /**
   * Uploads a video buffer/stream.
   * @param {object} file - Multer file object
   * @param {object} options - Optional folder, tags, etc.
   * @returns {Promise<{ provider: string, assetId: string, publicId: string, playbackUrl: string, thumbnailUrl: string, duration: number }>}
   */
  async uploadVideo(file, options = {}) {
    throw new Error('uploadVideo must be implemented by the provider.');
  }

  /**
   * Deletes a video asset by publicId.
   * @param {string} publicId
   * @returns {Promise<boolean>}
   */
  async deleteVideo(publicId) {
    throw new Error('deleteVideo must be implemented by the provider.');
  }

  /**
   * Gets video metadata.
   * @param {string} publicId
   * @returns {Promise<object>}
   */
  async getVideoMetadata(publicId) {
    throw new Error('getVideoMetadata must be implemented by the provider.');
  }

  /**
   * Generates authorized/signed playback information for a video.
   * @param {string} publicId
   * @param {object} options
   * @returns {Promise<{ playbackUrl: string, format: string, duration: number }>}
   */
  async generatePlaybackUrl(publicId, options = {}) {
    throw new Error('generatePlaybackUrl must be implemented by the provider.');
  }

  /**
   * Generates a thumbnail URL for a video.
   * @param {string} publicId
   * @returns {string}
   */
  generateThumbnail(publicId) {
    throw new Error('generateThumbnail must be implemented by the provider.');
  }
}

module.exports = MediaProviderInterface;
