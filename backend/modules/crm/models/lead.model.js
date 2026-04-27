const mongoose = require('mongoose');

const activityEntrySchema = new mongoose.Schema({
  note:      { type: String, required: true },
  type:      { type: String, enum: ['call', 'email', 'meeting', 'note', 'stage_change'], default: 'note' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const leadSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },

    // ── Contact Info ────────────────────────────────────────────────────────────
    name:    { type: String, required: [true, 'Lead name is required'], trim: true },
    email:   { type: String, lowercase: true, trim: true },
    phone:   { type: String, trim: true },
    company: { type: String, trim: true },
    source:  { type: String, enum: ['website', 'referral', 'social', 'cold_call', 'event', 'other'], default: 'other' },

    // ── Pipeline ────────────────────────────────────────────────────────────────
    stage: {
      type: String,
      enum: ['Inquiry', 'Follow-up', 'Converted', 'Enrolled'],
      default: 'Inquiry',
    },

    // ── Assignment ──────────────────────────────────────────────────────────────
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Interest ────────────────────────────────────────────────────────────────
    interestedIn: { type: String }, // Course/program name
    notes:        { type: String },

    // ── Activity Log (embedded) ─────────────────────────────────────────────────
    activities: [activityEntrySchema],
  },
  { timestamps: true }
);

leadSchema.index({ tenantId: 1, stage: 1 });
leadSchema.index({ tenantId: 1, assignedTo: 1 });

module.exports = mongoose.model('Lead', leadSchema);
