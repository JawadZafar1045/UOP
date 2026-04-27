const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    tenantId:   { type: String, required: true, index: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },

    // ── Personal Info ────────────────────────────────────────────────────────────
    employeeId: { type: String, trim: true },         // e.g., EMP-0001
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    dateOfJoining: { type: Date },
    dateOfBirth:   { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },

    // ── Contact ──────────────────────────────────────────────────────────────────
    address:   { type: String },
    emergency: { type: String },

    // ── Salary ───────────────────────────────────────────────────────────────────
    salary: { type: Number, default: 0 },

    // ── Status ───────────────────────────────────────────────────────────────────
    status: { type: String, enum: ['active', 'inactive', 'on_leave', 'terminated'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
