const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    tenantId:            { type: String, required: true, index: true },
    courseId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    title:               { type: String, required: true, trim: true }, // e.g. "Lecture 3 - Arrays"
    date:                { type: Date,   required: true },

    // ── Attendance window ────────────────────────────────────────────────────────
    attendanceOpenAt:    { type: Date },
    attendanceCloseAt:   { type: Date },
    // SECURITY: isOpen must ONLY be mutated by the toggleSession service function.
    // createSession hardcodes this to false. updateSession explicitly excludes it
    // from its whitelist. Any direct assignment from a request body is a
    // mass-assignment vulnerability — do not add isOpen to any create/update spread.
    isOpen:              { type: Boolean, default: false },

    // ── Material ─────────────────────────────────────────────────────────────────
    materialUrl:         { type: String },
    materialPublicId:    { type: String },
    materials: [
      {
        name: String,
        url: String,
        publicId: String
      }
    ],
  },
  { timestamps: true }
);

// Fetch sessions for a course sorted by newest first
sessionSchema.index({ tenantId: 1, courseId: 1, date: -1 });

module.exports = mongoose.model('Session', sessionSchema);
