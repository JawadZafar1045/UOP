const mongoose = require('mongoose');

const enrollmentRequestSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be: pending, approved, or rejected'
      },
      default: 'pending',
      index: true
    },
    message: { type: String, trim: true, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true }
  },
  { timestamps: true }
);

// Compound index for querying specific student requests per course
enrollmentRequestSchema.index({ tenantId: 1, studentId: 1, courseId: 1 });
enrollmentRequestSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('EnrollmentRequest', enrollmentRequestSchema);
