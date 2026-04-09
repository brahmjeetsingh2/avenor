const mongoose = require('mongoose');

const placementCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // The coordinator managing this cycle
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Batch year(s) eligible for this cycle
    batchesEligible: [String], // e.g., ["2024", "2025"]
    // College/Campus this cycle is for
    college: {
      type: String,
      trim: true,
      required: true,
    },
    // Timeline
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Cycle status
    status: {
      type: String,
      enum: ['planning', 'ongoing', 'completed', 'paused'],
      default: 'planning',
    },
    // Target metrics
    targetCompanies: {
      type: Number,
      default: 0,
    },
    targetOffers: {
      type: Number,
      default: 0,
    },
    // Actual metrics (updated as cycle progresses)
    registeredStudents: {
      type: Number,
      default: 0,
    },
    applicationsReceived: {
      type: Number,
      default: 0,
    },
    offersExtended: {
      type: Number,
      default: 0,
    },
    offersAccepted: {
      type: Number,
      default: 0,
    },
    // Bulletin/announcements
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

placementCycleSchema.index({ coordinator: 1, college: 1 });
placementCycleSchema.index({ startDate: 1, endDate: 1 });
placementCycleSchema.index({ status: 1 });

module.exports = mongoose.model('PlacementCycle', placementCycleSchema);
