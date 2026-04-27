const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  tenantId:  { type: String, required: true, index: true },
  to:        { type: String, required: true },
  subject:   { type: String, required: true },
  body:      { type: String },
  sentBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:    { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
  errorMsg:  { type: String },
  relatedEntity: {
    entityType: { type: String },
    entityId:   { type: mongoose.Schema.Types.ObjectId }
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);
