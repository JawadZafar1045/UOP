const mongoose = require('mongoose');
const slugify = require('slugify');

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Lecture title is required'], trim: true },
  description: { type: String, default: '', trim: true },
  contentType: { type: String, enum: ['video', 'pdf', 'text', 'quiz'], default: 'video' },
  contentUrl: { type: String },
  content: { type: String },
  duration: { type: Number, default: 0 }, // in seconds (or minutes)
  order: { type: Number, default: 0 },
  isPreview: { type: Boolean, default: false },
  video: {
    provider: { type: String, default: 'cloudinary' },
    assetId: { type: String },
    publicId: { type: String },
    playbackUrl: { type: String },
    thumbnailUrl: { type: String },
    duration: { type: Number, default: 0 },
  },
}, { _id: true, timestamps: true });

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Module title is required'], trim: true },
  description: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  lessons: [lectureSchema], // alias/preserve lessons compatibility
  lectures: [lectureSchema], // explicit Coursera-style naming
}, { _id: true, timestamps: true });

// Sync lessons & lectures if one is populated
moduleSchema.pre('validate', function (next) {
  if (this.lectures && this.lectures.length > 0 && (!this.lessons || this.lessons.length === 0)) {
    this.lessons = this.lectures;
  } else if (this.lessons && this.lessons.length > 0 && (!this.lectures || this.lectures.length === 0)) {
    this.lectures = this.lessons;
  }
  next();
});

const courseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true
    },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', alias: 'teacher' },
    instructorName: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    duration: { type: String, default: '' }, // e.g. "8 Hours" or "8 weeks"
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    category: { type: String, default: 'General' },
    level: { type: String, default: 'All levels' },
    maxStudents: { type: Number },
    tags: [{ type: String }],

    // ── Course Pricing & Type ───────────────────────────────────────────────────
    type: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free',
      index: true
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'PKR'
    },
    whatYouWillLearn: [{ type: String }],

    // ── Status & Schedule ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'published', 'completed', 'archived'],
        message: 'Status must be: draft, active, published, completed, or archived'
      },
      default: 'draft',
      index: true
    },
    startDate: { type: Date },
    endDate: { type: Date },

    // ── Completion Criteria ──────────────────────────────────────────────────────
    completionCriteria: {
      minAttendancePercent: { type: Number, default: 75 },
      minAssignmentScore: { type: Number, default: 60 },
      minQuizScore: { type: Number, default: 60 },
    },

    // ── Curriculum ───────────────────────────────────────────────────────────────
    modules: [moduleSchema],

    // ── Students (enrolled) ──────────────────────────────────────────────────────
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', alias: 'students' }],
  },
  { timestamps: true }
);

// Auto-generate & sanitize unique slug
courseSchema.pre('save', function (next) {
  if (!this.slug || this.slug.startsWith('http') || this.slug.includes('/') || this.slug.includes('?') || this.slug.includes('&')) {
    const base = slugify(this.title || 'course', { lower: true, strict: true }) || 'course';
    this.slug = `${base}-${Math.random().toString(36).substring(2, 6)}`;
  } else {
    this.slug = slugify(this.slug, { lower: true, strict: true });
  }

  // Sync isPublished with status
  if (this.status === 'published' || this.status === 'active') {
    this.isPublished = true;
  } else if (this.status === 'draft') {
    this.isPublished = false;
  }
  next();
});

// Compound index for public catalog queries
courseSchema.index({ tenantId: 1, isPublished: 1, status: 1 });
courseSchema.index({ slug: 1 });

module.exports = mongoose.model('Course', courseSchema);
