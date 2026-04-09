const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
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
    role:        { type: String, trim: true, required: true },
    ctc:         { type: Number, required: true, min: 0 },
    base:        { type: Number, default: 0 },
    bonus:       { type: Number, default: 0 },
    joiningBonus: { type: Number, default: 0 },
    location:    { type: String, trim: true, default: '' },
    workMode: {
      type: String,
      enum: ['onsite', 'hybrid', 'remote'],
      default: 'onsite',
    },
    joiningDate: { type: Date },
    bond: {
      hasBond:  { type: Boolean, default: false },
      duration: { type: Number, default: 0 },
      amount:   { type: Number, default: 0 },
    },
    perks:  [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['considering', 'accepted', 'declined'],
      default: 'considering',
    },
    notes:       { type: String, trim: true, default: '' },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

offerSchema.index({ student: 1, status: 1 });
offerSchema.index({ company: 1 });

module.exports = mongoose.model('Offer', offerSchema);
