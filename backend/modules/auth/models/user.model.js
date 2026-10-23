const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'cszone', index: true },
    name:     { type: String, required: [true, 'Name is required'], trim: true },
    email:    { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    avatar:       { type: String },
    phone:        { type: String },
    location:     { type: String },
    bio:          { type: String },
    isActive:     { type: Boolean, default: true },
    isApproved:   { type: Boolean, default: true },
    isVerified:   { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    refreshToken: { type: String, default: null }, // Store hashed refresh token
    lastLogin:    { type: Date },
  },
  { timestamps: true }
);

// Compound unique index: email must be unique per tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// ── Hash password before save ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
