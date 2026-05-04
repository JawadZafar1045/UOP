const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    tenantId:         { type: String, required: true, index: true },
    quizId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',   required: true },
    courseId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

    // ── Per-question responses ───────────────────────────────────────────────────
    answers: [
      {
        questionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' },
        selectedIndex: { type: Number },   // the option index the student chose
        isCorrect:     { type: Boolean },
        marksAwarded:  { type: Number },
      },
    ],

    // ── Aggregate scoring ────────────────────────────────────────────────────────
    totalMarks:       { type: Number },
    maxMarks:         { type: Number },
    percentScore:     { type: Number },
    passed:           { type: Boolean },

    // ── Timing ───────────────────────────────────────────────────────────────────
    startedAt:        { type: Date },
    submittedAt:      { type: Date },
    timeTakenSeconds: { type: Number },

    attemptNumber:    { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Quickly look up all attempts by a student on a quiz within a tenant
quizAttemptSchema.index({ tenantId: 1, quizId: 1, studentId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
