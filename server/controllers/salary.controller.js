const mongoose = require('mongoose');
const Salary    = require('../models/Salary.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse  = require('../utils/apiResponse');

// ─── Helper: median of sorted array ──────────────────────────────────────────
const median = (sorted) => {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

const sanitizeSalary = (salary) => {
  const out = salary?.toObject ? salary.toObject() : { ...(salary || {}) };
  delete out.submittedBy;
  return out;
};

// ─── SUBMIT SALARY ────────────────────────────────────────────────────────────
const submitSalary = asyncHandler(async (req, res) => {
  const { company, role, ctc, base, bonus, stockOptions, joiningBonus, location, year, batch, bond } = req.body;

  if (!company || !role || !ctc) {
    return apiResponse.error(res, 'company, role and ctc are required', 400);
  }

  // Allow one submission per user per company per year
  const existing = await Salary.findOne({
    submittedBy: req.user.id,
    company,
    year: year || new Date().getFullYear(),
    isDeleted: false,
  });
  if (existing) {
    return apiResponse.error(res, 'You have already submitted salary data for this company this year', 409);
  }

  const salary = await Salary.create({
    submittedBy: req.user.id,
    company, role, ctc,
    base:         base         || 0,
    bonus:        bonus        || 0,
    stockOptions: stockOptions || 0,
    joiningBonus: joiningBonus || 0,
    location:     location     || '',
    year:         year || new Date().getFullYear(),
    batch:        batch || '',
    bond:         bond  || { hasBond: false, duration: 0, amount: 0 },
  });

  await salary.populate('company', 'name logo sector');
  const out = sanitizeSalary(salary);

  return apiResponse.success(res, { salary: out }, 'Salary data submitted. Thank you!', 201);
});

// ─── GET AGGREGATED STATS (company-wise) ─────────────────────────────────────
const getAggregatedStats = asyncHandler(async (req, res) => {
  const { year, companyId } = req.query;

  const match = { isDeleted: false };
  if (year)      match.year    = Number(year);
  if (companyId) match.company = new mongoose.Types.ObjectId(companyId);

  // Aggregation pipeline for avg/min/max per company
  const stats = await Salary.aggregate([
    { $match: match },
    {
      $group: {
        _id:         '$company',
        avgCtc:      { $avg: '$ctc' },
        maxCtc:      { $max: '$ctc' },
        minCtc:      { $min: '$ctc' },
        count:       { $sum: 1 },
        ctcValues:   { $push: '$ctc' },
        avgBase:     { $avg: '$base' },
        roles:       { $addToSet: '$role' },
        locations:   { $addToSet: '$location' },
        bondCount:   { $sum: { $cond: ['$bond.hasBond', 1, 0] } },
      },
    },
    {
      $lookup: {
        from:         'companies',
        localField:   '_id',
        foreignField: '_id',
        as:           'company',
      },
    },
    { $unwind: '$company' },
    {
      $project: {
        company:   { _id: 1, name: 1, logo: 1, sector: 1 },
        avgCtc:    { $round: ['$avgCtc', 2] },
        maxCtc:    1,
        minCtc:    1,
        count:     1,
        ctcValues: 1,
        avgBase:   { $round: ['$avgBase', 2] },
        roles:     1,
        locations: 1,
        bondCount: 1,
      },
    },
    { $sort: { avgCtc: -1 } },
  ]);

  // Compute median client-side friendly (sorted array included)
  const enriched = stats.map((s) => {
    const sorted = [...s.ctcValues].sort((a, b) => a - b);
    return { ...s, medianCtc: median(sorted), ctcValues: undefined };
  });

  return apiResponse.success(res, { stats: enriched });
});

// ─── GET ALL (coordinator — with submitter info) ──────────────────────────────
const getAllSalaries = asyncHandler(async (req, res) => {
  const { company, year, page = 1, limit = 20 } = req.query;
  const filter = { isDeleted: false };
  if (company) filter.company = company;
  if (year)    filter.year    = Number(year);

  const [salaries, total] = await Promise.all([
    Salary.find(filter)
      .populate('company', 'name logo sector')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Salary.countDocuments(filter),
  ]);

  return apiResponse.paginated(
    res,
    salaries.map((s) => sanitizeSalary(s)),
    { page: Number(page), limit: Number(limit), total }
  );
});

// ─── GET MY SALARY CONTRIBUTIONS ────────────────────────────────────────────
const getMySalaries = asyncHandler(async (req, res) => {
  const { year, page = 1, limit = 20 } = req.query;
  const filter = {
    submittedBy: req.user.id,
    isDeleted: false,
  };

  if (year) filter.year = Number(year);

  const [salaries, total] = await Promise.all([
    Salary.find(filter)
      .populate('company', 'name logo sector')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Salary.countDocuments(filter),
  ]);

  return apiResponse.paginated(
    res,
    salaries.map((s) => sanitizeSalary(s)),
    { page: Number(page), limit: Number(limit), total }
  );
});

// ─── UPDATE MY SALARY CONTRIBUTION ──────────────────────────────────────────
const updateSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id);
  if (!salary || salary.isDeleted) return apiResponse.error(res, 'Not found', 404);

  const isOwner = salary.submittedBy.toString() === req.user.id;
  const isCoord = req.user.role === 'coordinator';
  if (!isOwner && !isCoord) return apiResponse.error(res, 'Forbidden', 403);

  const editable = [
    'role',
    'ctc',
    'base',
    'bonus',
    'stockOptions',
    'joiningBonus',
    'location',
    'year',
    'batch',
    'bond',
  ];

  editable.forEach((field) => {
    if (field in req.body) salary[field] = req.body[field];
  });

  await salary.save();
  await salary.populate('company', 'name logo sector');

  return apiResponse.success(res, { salary: sanitizeSalary(salary) }, 'Salary contribution updated');
});

// ─── VERIFY SALARY (coordinator) ─────────────────────────────────────────────
const verifySalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  ).populate('company', 'name logo');

  if (!salary) return apiResponse.error(res, 'Salary entry not found', 404);

  const out = sanitizeSalary(salary);
  return apiResponse.success(res, { salary: out }, 'Salary verified');
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id);
  if (!salary) return apiResponse.error(res, 'Not found', 404);

  const isOwner = salary.submittedBy.toString() === req.user.id;
  const isCoord = req.user.role === 'coordinator';
  if (!isOwner && !isCoord) return apiResponse.error(res, 'Forbidden', 403);

  salary.isDeleted = true;
  await salary.save();
  return apiResponse.success(res, {}, 'Deleted');
});

module.exports = {
  submitSalary,
  getAggregatedStats,
  getAllSalaries,
  getMySalaries,
  updateSalary,
  verifySalary,
  deleteSalary,
};
