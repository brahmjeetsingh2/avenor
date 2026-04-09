const mongoose = require('mongoose');

const mentorshipMilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 160,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const mentorshipUpdateSchema = new mongoose.Schema(
  {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      enum: ['student', 'alumni', 'system'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    college: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      enum: ['interview_prep', 'resume_review', 'career_guidance', 'referral_help', 'general'],
      default: 'general',
      index: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
    preferredTime: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    responseNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    session: {
      isActive: {
        type: Boolean,
        default: false,
      },
      activatedAt: {
        type: Date,
        default: null,
      },
      targetDate: {
        type: Date,
        default: null,
      },
      milestones: [mentorshipMilestoneSchema],
      updates: [mentorshipUpdateSchema],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

mentorshipRequestSchema.index({ student: 1, createdAt: -1 });
mentorshipRequestSchema.index({ alumni: 1, status: 1, createdAt: -1 });
mentorshipRequestSchema.index({ college: 1, createdAt: -1 });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
