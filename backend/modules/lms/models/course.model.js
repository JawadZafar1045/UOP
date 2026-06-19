const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true
    },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', alias: 'teacher' },
    thumbnail: { type: String },
    duration: { type: String }, // e.g. "8 weeks"
    isPublished: { type: Boolean, default: false },
    category: { type: String },
    level: { type: String },
    maxStudents: { type: Number },

    // ── Status & Schedule ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'completed'],
        message: 'Status must be: draft, active, or completed'
      },
      default: 'draft'
    },
    startDate: { type: Date },
    endDate: { type: Date },

    // ── Completion Criteria ──────────────────────────────────────────────────────
    completionCriteria: {
      minAttendancePercent: { type: Number, default: 75 },
      minAssignmentScore: { type: Number, default: 60 },
      minQuizScore: { type: Number, default: 60 },
    },

    // ── Curriculum ───────────────────────────────────────────────────────────────
    modules: [
      {
        title: { type: String, required: [true, 'cannot allow empty value'] },
        order: { type: Number, default: 0 },
        lessons: [
          {
            title: { type: String, required: [true, 'cannot allow empty value'] },
            contentType: { type: String, enum: ['video', 'pdf', 'text', 'quiz'], default: 'text' },
            contentUrl: { type: String },
            content: { type: String },
            duration: { type: Number }, // minutes
            order: { type: Number, default: 0 },
          },
        ],
      },
    ],

    // ── Students (enrolled) ──────────────────────────────────────────────────────
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', alias: 'students' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
