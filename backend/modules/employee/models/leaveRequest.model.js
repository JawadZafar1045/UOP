const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    tenantId:   { type: String, required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType:  { type: String, enum: ['sick', 'annual', 'emergency', 'unpaid'], required: true },
    startDate:  { type: Date, required: true },
    endDate:    { type: Date, required: true },
    reason:     { type: String, required: true },
    status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
