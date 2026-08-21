const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lectureId: { type: String, required: true, index: true },
    progressSeconds: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false, index: true },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index: one progress record per user per course per lecture
lectureProgressSchema.index({ tenantId: 1, userId: 1, courseId: 1, lectureId: 1 }, { unique: true });
lectureProgressSchema.index({ userId: 1, courseId: 1, completed: 1 });

module.exports = mongoose.model('LectureProgress', lectureProgressSchema);
