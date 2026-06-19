const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    tenantId:              { type: String, required: true, index: true },
    courseId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

    // ── Certificate identity ─────────────────────────────────────────────────────
    certificateNumber:     { type: String, unique: true }, // e.g. "UOP-2026-00123"
    issuedAt:              { type: Date, default: Date.now },

    // ── Achievement snapshot ─────────────────────────────────────────────────────
    attendancePercent:     { type: Number },
    averageAssignmentScore:{ type: Number },
    averageQuizScore:      { type: Number },

    // ── Cloudinary PDF asset ─────────────────────────────────────────────────────
    fileUrl:               { type: String }, // Cloudinary URL of the generated PDF
    publicId:              { type: String }, // Cloudinary public ID

    // ── Verification ─────────────────────────────────────────────────────────────
    verificationCode:      { type: String, unique: true }, // UUID v4
    isValid:               { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Enforce one certificate per student per course per tenant
certificateSchema.index({ tenantId: 1, courseId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
