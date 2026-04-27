const mongoose = require('mongoose');

const LIFECYCLE_STAGES = ['Created', 'Sent', 'Viewed', 'Printed'];

const documentSchema = new mongoose.Schema(
  {
    tenantId:    { type: String, required: true, index: true },
    title:       { type: String, required: [true, 'Document title is required'], trim: true },
    description: { type: String },
    category:    { type: String, enum: ['contract', 'policy', 'invoice', 'report', 'other'], default: 'other' },

    // ── File Info ────────────────────────────────────────────────────────────────
    fileUrl:    { type: String, required: true },
    publicId:   { type: String, required: true },  // Cloudinary public ID for deletion
    fileSize:   { type: Number },                  // bytes
    mimeType:   { type: String },
    fileName:   { type: String },

    // ── Ownership ────────────────────────────────────────────────────────────────
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Linked Entity (optional) ─────────────────────────────────────────────────
    relatedEntity: {
      entityType: { type: String }, // 'Lead', 'Student', 'Employee'
      entityId:   { type: mongoose.Schema.Types.ObjectId },
    },

    // ── Lifecycle ────────────────────────────────────────────────────────────────
    lifecycle: {
      type: String,
      enum: LIFECYCLE_STAGES,
      default: 'Created',
    },

    // ── Activity Log (embedded) ──────────────────────────────────────────────────
    activities: [
      {
        event:     { type: String, enum: LIFECYCLE_STAGES },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note:      { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
