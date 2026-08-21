const mongoose = require('mongoose');

const courseRegistrationSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    paymentReference: { type: String, trim: true },
    notes: { type: String, trim: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index to quickly find user's registration for a course
courseRegistrationSchema.index({ tenantId: 1, courseId: 1, userId: 1 });
courseRegistrationSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('CourseRegistration', courseRegistrationSchema);
