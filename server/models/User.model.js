const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'coordinator', 'alumni'],
      required: [true, 'Role is required'],
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    profilePic: {
      type: String,
      default: '',
    },
    placementProfile: {
      phoneNumber: { type: String, trim: true, default: '' },
      resumeUrl: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      skills: [{ type: String, trim: true }],
      preferredRoles: [{ type: String, trim: true }],
      preferredLocations: [{ type: String, trim: true }],
      placementGoals: { type: String, trim: true, default: '' },
      hideFromCommunity: { type: Boolean, default: false },
    },
    savedCompanies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    }],
    savedReferrals: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
    }],
    hiddenReferrals: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
    }],
    alumniProfile: {
      currentCompany: { type: String, trim: true, default: '' },
      currentRole: { type: String, trim: true, default: '' },
      graduationYear: { type: Number, default: null },
      linkedin: { type: String, trim: true, default: '' },
      bio: { type: String, trim: true, default: '' },
      expertiseTags: [{ type: String, trim: true }],
      availability: {
        referralRequests: { type: Boolean, default: true },
        mentorship: { type: Boolean, default: true },
        resumeReview: { type: Boolean, default: false },
      },
    },
    coordinatorProfile: {
      managedCollege: { type: String, trim: true, default: '' },
      managedBranches: [{ type: String, trim: true }],
      managedBatches: [{ type: String, trim: true }],
      capabilities: [{
        type: String,
        enum: [
          'manage_companies',
          'manage_shortlists',
          'send_announcements',
          'view_analytics',
          'bulk_actions',
        ],
      }],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    // OTP for password reset
    resetOTP: {
      type: String,
      select: false,
    },
    resetOTPExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Hash password before save ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Compare password ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Remove sensitive fields from JSON output ─────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetOTP;
  delete obj.resetOTPExpiry;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
