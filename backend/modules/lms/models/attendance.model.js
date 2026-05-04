const mongoose = require('mongoose');

// ── Session-based attendance (replaces the old date-based design) ─────────────
const attendanceSchema = new mongoose.Schema(
  {
    tenantId:       { type: String, required: true, index: true },
    sessionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Session',  required: true },
    courseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course',   required: true },
    studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    status:         { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    markedAt:       { type: Date },
    ipAddress:      { type: String },

    // ── Override (instructor correction) ────────────────────────────────────────
    overriddenBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overrideReason: { type: String },
  },
  { timestamps: true }
);

// Compound unique index: one record per student per session per tenant
attendanceSchema.index({ tenantId: 1, sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
