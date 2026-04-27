const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:   { type: String, required: true }, // e.g. CREATE_LEAD, VIEW_DOCUMENT
    entityType: { type: String, required: true }, // e.g. Lead, Document, User
    entityId: { type: mongoose.Schema.Types.ObjectId },
    meta:     { type: mongoose.Schema.Types.Mixed, default: {} }, // IP, extra context
  },
  { timestamps: true }
);

// Compound index for efficient tenant + entity queries
activityLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
activityLogSchema.index({ tenantId: 1, userId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
