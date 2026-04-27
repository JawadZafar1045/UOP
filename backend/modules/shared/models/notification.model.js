const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:    { type: String, required: true },
    message:  { type: String, required: true },
    type:     { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    link:     { type: String }, // Optional deep link (e.g., /crm/leads/123)
    isRead:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
