const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'announcement',
        'shortlist',
        'status_update',
        'interview_slot',
        'new_experience',
        'offer',
        'referral_posted',
        'referral_engagement',
        'mentorship_request',
        'mentorship_update',
        'general',
      ],
      required: true,
    },
    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    data:    { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead:  { type: Boolean, default: false, index: true },
    readAt:  { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // TTL: 90 days

module.exports = mongoose.model('Notification', notificationSchema);
