const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    tenantId:    { type: String, required: true, index: true },
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    instructions:{ type: String },
    dueDate:     { type: Date },
    maxMarks:    { type: Number, default: 100 },

    materials: [
      {
        name: String,
        url: String,
        publicId: String
      }
    ],

    // ── Submissions ──────────────────────────────────────────────────────────────
    submissions: [
      {
        studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fileUrl:     { type: String },
        submittedAt: { type: Date, default: Date.now },
        marks:       { type: Number },
        feedback:    { type: String },
        status:      { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
