const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  tenantId:       { type: String, required: true, index: true },
  conversationId: { type: String, required: true, index: true }, // e.g., 'lead_123', 'internal_456'
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:        { type: String, required: true },
  isRead:         { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
