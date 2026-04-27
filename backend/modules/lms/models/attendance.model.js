const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    tenantId:  { type: String, required: true, index: true },
    courseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, required: true },
    status:    { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    notes:     { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ tenantId: 1, courseId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
