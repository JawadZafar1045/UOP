const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    tenantId:              { type: String, required: true, index: true },
    courseId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title:                 { type: String, required: true, trim: true },
    instructions:          { type: String },

    // ── Quiz settings ────────────────────────────────────────────────────────────
    timeLimit:             { type: Number, default: null }, // minutes; null = no limit
    passMark:              { type: Number, default: 60 },   // percent
    maxAttempts:           { type: Number, default: 1 },
    shuffleQuestions:      { type: Boolean, default: false },
    showResultImmediately: { type: Boolean, default: true },

    // ── Negative marking / Scoring settings (e.g. PPSC style) ───────────────────
    enableNegativeMarking: { type: Boolean, default: false },
    correctMark:           { type: Number, default: 1 },    // Marks for correct answer (+1)
    negativeMark:          { type: Number, default: 0 },    // Marks deducted for wrong answer (e.g. 0.25)
    unattemptedMark:       { type: Number, default: 0 },    // Marks for unattempted question (e.g. 0)

    status: {
      type:    String,
      enum:    ['draft', 'published', 'closed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
