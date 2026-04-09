const mongoose = require('mongoose');

const aiHistorySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    role: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: ['interview_prep', 'resume_feedback', 'mock_interview'],
      required: true,
    },
    // Generated prep content
    prepContent: {
      type: String,
      default: '',
    },
    // For mock interviews: performance score
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Key takeaways
    keyTakeaways: [String],
    // Questions asked (for mock interviews)
    questionsAsked: [String],
    // Duration in minutes
    duration: {
      type: Number,
      default: null,
    },
    // Flag if student found it helpful
    isHelpful: {
      type: Boolean,
      default: null,
    },
    // Optional notes from student
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // Experience count used for context
    experienceCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
aiHistorySchema.index({ student: 1, createdAt: -1 });
aiHistorySchema.index({ company: 1, student: 1 });
aiHistorySchema.index({ type: 1, student: 1 });
aiHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIHistory', aiHistorySchema);
