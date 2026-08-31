const mongoose = require('mongoose');

/**
 * Program (Degree) Model
 * Represents an academic degree/program (e.g. BSc Agriculture).
 * Top-level academic entity under a School/Faculty.
 */
const programSchema = new mongoose.Schema(
  {
    tenantId:   { type: String, required: true, index: true },
    name:       { type: String, required: [true, 'Program name is required'], trim: true, maxlength: 150 }, // e.g. "BSc Agriculture"
    code:       { type: String, trim: true, uppercase: true, maxlength: 20 },                               // e.g. "BSC-AGRI"
    school:     { type: String, trim: true, maxlength: 150 },                                               // e.g. "School of Agriculture"
    faculty:    { type: String, trim: true, maxlength: 150 },                                               // alias / broader faculty name
    description: { type: String, trim: true, default: '' },

    degreeLevel: {
      type: String,
      enum: ['undergraduate', 'postgraduate', 'diploma', 'certificate', 'other'],
      default: 'undergraduate',
    },

    totalCreditHours:    { type: Number, default: 120, min: 0 },   // total credit hours to graduate
    passingGradePercent: { type: Number, default: 60, min: 0, max: 100 },

    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Compound unique: same program name per tenant
programSchema.index({ tenantId: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('Program', programSchema);
