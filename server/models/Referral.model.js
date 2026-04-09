const mongoose = require('mongoose');

const engagementEventSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['click', 'save', 'apply_intent', 'contact_intent'],
      required: true,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const referralSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    college: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    role: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120,
    },
    company: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120,
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract'],
      default: 'Full-time',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    link: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['active', 'filled', 'closed'],
      default: 'active',
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    filledAt: {
      type: Date,
      default: null,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    saveCount: {
      type: Number,
      default: 0,
    },
    applyIntentCount: {
      type: Number,
      default: 0,
    },
    contactIntentCount: {
      type: Number,
      default: 0,
    },
    engagementEvents: [engagementEventSchema],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

referralSchema.index({ postedBy: 1, createdAt: -1 });
referralSchema.index({ college: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Referral', referralSchema);
