const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['aptitude', 'technical', 'hr', 'managerial', 'group_discussion', 'coding', 'case_study'],
    required: true,
  },
  questions: [{ type: String, trim: true }],
  experience: { type: String, trim: true, default: '' },
  duration:   { type: String, trim: true, default: '' }, // e.g. "45 minutes"
}, { _id: true });

const experienceSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: { type: Boolean, default: false },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    role:       { type: String, trim: true, required: true },
    year:       { type: Number, required: true },
    batch:      { type: String, trim: true, default: '' },
    rounds:     [roundSchema],
    verdict: {
      type: String,
      enum: ['selected', 'rejected', 'waitlisted'],
      required: true,
    },
    difficulty: { type: Number, min: 1, max: 5, required: true },
    tips:       { type: String, trim: true, default: '' },
    upvotes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount:{ type: Number, default: 0 },
    tags:       [{ type: String, trim: true }],
    isDeleted:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Keep upvoteCount in sync
experienceSchema.pre('save', function (next) {
  this.upvoteCount = this.upvotes.length;
  next();
});

// Indexes
experienceSchema.index({ company: 1, createdAt: -1 });
experienceSchema.index({ author: 1 });
experienceSchema.index({ verdict: 1 });
experienceSchema.index({ upvoteCount: -1 });
experienceSchema.index({ createdAt: -1 });
experienceSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Experience', experienceSchema);
