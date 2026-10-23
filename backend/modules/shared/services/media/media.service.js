const CloudinaryProvider = require('./providers/cloudinary.provider');

class MediaService {
  constructor() {
    // Current default provider: Cloudinary
    // In future, can switch dynamically based on process.env.MEDIA_PROVIDER
    this.provider = new CloudinaryProvider();
  }

  /**
   * Upload video lecture.
   */
  async uploadVideo(file, options = {}) {
    return this.provider.uploadVideo(file, options);
  }

  /**
   * Delete video.
   */
  async deleteVideo(publicId) {
    return this.provider.deleteVideo(publicId);
  }

  /**
   * Get video metadata.
   */
  async getVideoMetadata(publicId) {
    return this.provider.getVideoMetadata(publicId);
  }

  /**
   * Generate secure playback URL for authorized students.
   */
  async generatePlaybackUrl(publicId, options = {}) {
    return this.provider.generatePlaybackUrl(publicId, options);
  }

  /**
   * Generate thumbnail.
   */
  generateThumbnail(publicId) {
    return this.provider.generateThumbnail(publicId);
  }
}

// Export singleton instance
module.exports = new MediaService();
