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
        selectedIndex: { type: Number },   // the option index the student chose (-1 if unattempted)
        isCorrect:     { type: Boolean },
        marksAwarded:  { type: Number },
        status:        { type: String, enum: ['correct', 'wrong', 'unattempted'], default: 'unattempted' },
      },
    ],

    // ── Aggregate scoring & Negative Marking Breakdown ───────────────────────────
    correctCount:     { type: Number, default: 0 },
    wrongCount:       { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    totalMarks:       { type: Number },
    maxMarks:         { type: Number },
    percentScore:     { type: Number },
    passed:           { type: Boolean },

    markingScheme: {
      enableNegativeMarking: { type: Boolean, default: false },
      correctMark:           { type: Number, default: 1 },
      negativeMark:          { type: Number, default: 0 },
      unattemptedMark:       { type: Number, default: 0 },
    },

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
