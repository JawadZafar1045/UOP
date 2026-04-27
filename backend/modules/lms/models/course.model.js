const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    tenantId:    { type: String, required: true, index: true },
    title:       { type: String, required: [true, 'Course title is required'], trim: true },
    description: { type: String, trim: true },
    instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    thumbnail:   { type: String },
    duration:    { type: String }, // e.g. "8 weeks"
    isPublished: { type: Boolean, default: false },

    // ── Curriculum ───────────────────────────────────────────────────────────────
    modules: [
      {
        title:   { type: String, required: true },
        order:   { type: Number, default: 0 },
        lessons: [
          {
            title:       { type: String, required: true },
            contentType: { type: String, enum: ['video', 'pdf', 'text', 'quiz'], default: 'text' },
            contentUrl:  { type: String },
            content:     { type: String },
            duration:    { type: Number }, // minutes
            order:       { type: Number, default: 0 },
          },
        ],
      },
    ],

    // ── Students (enrolled) ──────────────────────────────────────────────────────
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
