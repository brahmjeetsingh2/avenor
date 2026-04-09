const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['student', 'coordinator', 'alumni'],
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    summary: { type: String, trim: true, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    college: { type: String, trim: true, default: '', index: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ college: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
