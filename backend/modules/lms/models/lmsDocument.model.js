const mongoose = require('mongoose');

const lmsDocumentSchema = new mongoose.Schema(
  {
    tenantId:          { type: String, required: true, index: true },
    courseId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    title:             { type: String, required: true, trim: true },
    description:       { type: String },

    // ── Cloudinary asset info ────────────────────────────────────────────────────
    fileUrl:           { type: String, required: true },
    publicId:          { type: String, required: true }, // Cloudinary public ID
    resourceType:      { type: String, enum: ['image', 'raw', 'video', 'auto'], default: 'raw' },

    // ── File metadata ────────────────────────────────────────────────────────────
    fileType:          { type: String, enum: ['pdf', 'docx', 'pptx', 'mp4', 'image', 'other'] },
    fileSize:          { type: Number }, // bytes

    visibleToStudents: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LmsDocument', lmsDocumentSchema);
