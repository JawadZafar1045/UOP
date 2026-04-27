const ActivityLog = require('../models/activityLog.model');

/**
 * Log an activity to the database.
 * Can be called from any controller/service.
 *
 * @param {object} params
 * @param {string} params.userId       - Who performed the action
 * @param {string} params.tenantId     - Tenant context
 * @param {string} params.action       - e.g., 'CREATE_LEAD', 'VIEW_DOCUMENT'
 * @param {string} params.entityType   - e.g., 'Lead', 'Document', 'User'
 * @param {string} [params.entityId]   - ObjectId of the affected entity
 * @param {object} [params.meta]       - Optional extra data (IP, changes, etc.)
 */
const logActivity = async ({ userId, tenantId, action, entityType, entityId, meta = {} }) => {
  try {
    await ActivityLog.create({ userId, tenantId, action, entityType, entityId, meta });
  } catch (err) {
    // Activity logging must NEVER crash the main request
    console.error('[ActivityLog] Failed to log activity:', err.message);
  }
};

module.exports = { logActivity };
