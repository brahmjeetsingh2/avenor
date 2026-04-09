const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Never exposed in API responses — always stripped
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    role:         { type: String, trim: true, required: true },
    ctc:          { type: Number, required: true, min: 0 },   // Total CTC in LPA
    base:         { type: Number, default: 0 },
    bonus:        { type: Number, default: 0 },
    stockOptions: { type: Number, default: 0 },
    joiningBonus: { type: Number, default: 0 },
    location:     { type: String, trim: true, default: '' },
    year:         { type: Number, required: true },
    batch:        { type: String, trim: true, default: '' },
    isVerified:   { type: Boolean, default: false },           // Coordinator-verified
    bond: {
      hasBond:  { type: Boolean, default: false },
      duration: { type: Number, default: 0 },                  // months
      amount:   { type: Number, default: 0 },                  // penalty in lakhs
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

salarySchema.index({ company: 1, year: -1 });
salarySchema.index({ submittedBy: 1 });
salarySchema.index({ isVerified: 1 });

module.exports = mongoose.model('Salary', salarySchema);
