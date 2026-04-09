const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['draft', 'announced', 'ppt', 'test', 'interview', 'offer', 'closed'],
    required: true,
  },
  date: { type: Date, required: true },
  description: { type: String, trim: true, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true, timestamps: true });

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    logo: { type: String, default: '' },
    description: { type: String, trim: true, default: '' },
    sector: {
      type: String,
      enum: ['Technology', 'Finance', 'Consulting', 'Core Engineering', 'Analytics', 'E-Commerce', 'Healthcare', 'Other'],
      required: [true, 'Sector is required'],
    },
    type: {
      type: String,
      enum: ['product', 'service', 'startup', 'psu', 'mnc'],
      required: [true, 'Company type is required'],
    },
    ctc: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    roles: [{ type: String, trim: true }],
    currentStage: {
      type: String,
      enum: ['draft', 'announced', 'ppt', 'test', 'interview', 'offer', 'closed'],
      default: 'announced',
    },
    timeline: [timelineEntrySchema],
    eligibility: {
      cgpa: { type: Number, default: 0, min: 0, max: 10 },
      branches: [{ type: String }],
      backlogs: { type: Number, default: 0 },
    },
    documents: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
    applicationDeadline: { type: Date },
    websiteUrl: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Indexes for fast filtering
companySchema.index({ currentStage: 1 });
companySchema.index({ sector: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ applicationDeadline: 1 });
companySchema.index({ 'ctc.max': 1 });
companySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Company', companySchema);
