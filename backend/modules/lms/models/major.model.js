const mongoose = require('mongoose');

/**
 * Major (Specialization) Model
 * Represents a major/specialization under a Degree/Program.
 * e.g. Agronomy, Entomology under BSc Agriculture.
 */
const majorSchema = new mongoose.Schema(
  {
    tenantId:  { type: String, required: true, index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: [true, 'Program is required'], index: true },
    name:      { type: String, required: [true, 'Major name is required'], trim: true, maxlength: 150 }, // e.g. "Agronomy"
    code:      { type: String, trim: true, uppercase: true, maxlength: 20 },                             // e.g. "AGRON"
    description: { type: String, trim: true, default: '' },

    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Optional department coordinator

    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

majorSchema.index({ tenantId: 1, programId: 1 });

module.exports = mongoose.model('Major', majorSchema);
