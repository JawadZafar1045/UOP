const Notification = require('../models/notification.model');
const { getIO } = require('../../../config/socket');

/**
 * Create and push a real-time notification.
 * Saves to DB and emits via Socket.io to the target user's room.
 *
 * @param {object} params
 * @param {string} params.userId     - Recipient user ID
 * @param {string} params.tenantId   - Tenant context
 * @param {string} params.title      - Notification title
 * @param {string} params.message    - Notification body
 * @param {string} [params.type]     - 'info' | 'success' | 'warning' | 'error'
 * @param {string} [params.link]     - Optional deep-link URL
 */
const sendNotification = async ({ userId, tenantId, title, message, type = 'info', link }) => {
  try {
    const notification = await Notification.create({ userId, tenantId, title, message, type, link });

    // Push real-time event to user's socket room
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', notification);
    } catch {
      // Socket may not be initialized in test environments
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Failed to send notification:', err.message);
  }
};

module.exports = { sendNotification };
