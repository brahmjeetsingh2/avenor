const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  note:      { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const applicationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3', 'offer', 'rejected'],
      default: 'applied',
    },
    statusHistory: [statusHistorySchema],
    interviewSlot: {
      date:   { type: Date },
      time:   { type: String },
      mode:   { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
      link:   { type: String, default: '' },
      venue:  { type: String, default: '' },
    },
    documents: [
      {
        name: { type: String },
        url:  { type: String },
      },
    ],
    coordinatorNotes: { type: String, default: '' },
    isWithdrawn:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One student can apply to a company only once
applicationSchema.index({ student: 1, company: 1 }, { unique: true });
applicationSchema.index({ student: 1, status: 1 });
applicationSchema.index({ company: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
