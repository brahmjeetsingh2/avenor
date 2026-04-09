const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    format: { type: String, enum: ['plain', 'markdown'], default: 'plain' },
    targetType: {
      type: String,
      enum: ['all', 'branch', 'batch', 'branch_batch'],
      default: 'all',
      index: true,
    },
    target: {
      college: { type: String, trim: true, default: '', index: true },
      branch: { type: String, trim: true, default: '' },
      batch: { type: String, trim: true, default: '' },
    },
    templateKey: { type: String, trim: true, default: '' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['not_started', 'scheduled', 'partial', 'delivered', 'failed'],
      default: 'not_started',
    },
    targetCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    scheduledFor: { type: Date, default: null, index: true },
    sentAt: { type: Date, default: null },
    lastError: { type: String, trim: true, default: '' },
    meta: {
      sourceAnnouncementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Announcement',
        default: null,
      },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
  },
  { timestamps: true }
);

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
