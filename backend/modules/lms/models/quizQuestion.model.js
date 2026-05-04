const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    tenantId:     { type: String, required: true, index: true },
    quizId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    question:     { type: String, required: true },

    // ── MCQ options ──────────────────────────────────────────────────────────────
    options:      [{ type: String }],           // array of 4 option strings
    correctIndex: { type: Number },             // 0-based index of the correct option

    // ── Result feedback ──────────────────────────────────────────────────────────
    explanation:  { type: String },             // shown to student after attempt

    // ── Scoring & ordering ───────────────────────────────────────────────────────
    marks:        { type: Number, default: 1 },
    order:        { type: Number, default: 0 },
  }
  // No timestamps needed for individual questions
);

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
