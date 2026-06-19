const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    design: {
      backgroundColor: { type: String, default: '#FAFAF7' },
      accentColor: { type: String, default: '#2563EB' },
      textColor: { type: String, default: '#1B3A5C' },
      fontStyle: { type: String, enum: ['serif', 'sans', 'elegant'], default: 'serif' },
      logoUrl: { type: String },
      logoPublicId: { type: String },
      signatoryName: { type: String },
      signatoryTitle: { type: String },
      instituteName: { type: String },
      borderStyle: { type: String, enum: ['double', 'single', 'none'], default: 'double' },
    },
  },
  { timestamps: true }
);

certificateTemplateSchema.index({ courseId: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
