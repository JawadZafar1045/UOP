const mongoose = require('mongoose');

const videoLectureSchema = new mongoose.Schema(
  {
    tenantId:         { type: String, required: true, index: true },
    courseId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    title:            { type: String, required: [true, 'Lecture title is required'], trim: true },
    description:      { type: String, trim: true, default: '' },
    moduleName:       { type: String, trim: true, default: 'General' },
    
    // Video Link & Source
    videoUrl:         { type: String, required: [true, 'Video URL is required'], trim: true },
    youtubeVideoId:   { type: String, trim: true, default: '' },
    durationMinutes:  { type: Number, default: 0 },
    order:            { type: Number, default: 0 },
    
    // Notes & Resources
    notes:            { type: String, default: '' },
    resources: [
      {
        title: { type: String, required: true },
        url:   { type: String, required: true },
        type:  { type: String, default: 'pdf' }
      }
    ],

    // Publishing status
    isPublished:      { type: Boolean, default: true },
    
    // Track completed students
    completedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

videoLectureSchema.index({ tenantId: 1, courseId: 1, order: 1 });

module.exports = mongoose.model('VideoLecture', videoLectureSchema);
