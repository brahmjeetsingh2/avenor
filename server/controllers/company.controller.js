const Company = require('../models/Company.model');
const Application = require('../models/Application.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { validationResult } = require('express-validator');
const { logCoordinatorAction } = require('../services/audit.service');

const STAGES = ['draft', 'announced', 'ppt', 'test', 'interview', 'offer', 'closed'];
const ALLOWED_STAGE_TRANSITIONS = {
  draft: ['announced', 'closed'],
  announced: ['ppt', 'test', 'interview', 'closed'],
  ppt: ['test', 'interview', 'closed'],
  test: ['interview', 'offer', 'closed'],
  interview: ['offer', 'closed'],
  offer: ['closed'],
  closed: [],
};

// ─── GET ALL COMPANIES ────────────────────────────────────────────────────────
const getAllCompanies = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    stage, sector, type,
    ctcMin, ctcMax,
    branch, search,
    sortBy = 'createdAt', order = 'desc',
    active = 'true',
  } = req.query;

  const filter = {};
  if (active !== 'all') filter.isActive = active === 'true';
  if (stage)   filter.currentStage = stage;
  if (sector)  filter.sector = sector;
  if (type)    filter.type = type;
  if (ctcMin)  filter['ctc.max'] = { $gte: Number(ctcMin) };
  if (ctcMax)  filter['ctc.min'] = { ...(filter['ctc.min'] || {}), $lte: Number(ctcMax) };
  if (branch)  filter['eligibility.branches'] = { $in: [branch] };
  if (search)  filter.name = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Company.countDocuments(filter),
  ]);

  return apiResponse.paginated(res, companies, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─── GET COMPANY BY ID ────────────────────────────────────────────────────────
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('timeline.updatedBy', 'name');

  if (!company) return apiResponse.error(res, 'Company not found', 404);
  return apiResponse.success(res, { company });
});

// ─── CREATE COMPANY ───────────────────────────────────────────────────────────
const createCompany = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return apiResponse.error(res, 'Validation failed', 400, errors.array());

  const {
    name, logo, description, sector, type,
    ctc, roles, eligibility, documents,
    applicationDeadline, websiteUrl, location,
  } = req.body;

  const company = await Company.create({
    name, logo, description, sector, type,
    ctc: ctc || { min: 0, max: 0 },
    roles: roles || [],
    eligibility: eligibility || { cgpa: 0, branches: [], backlogs: 0 },
    documents: documents || [],
    applicationDeadline,
    websiteUrl,
    location,
    createdBy: req.user.id,
    timeline: [{
      stage: 'announced',
      date: new Date(),
      description: 'Company announced',
      updatedBy: req.user.id,
    }],
  });

  await company.populate('createdBy', 'name email');

  await logCoordinatorAction({
    req,
    action: 'company.created',
    entityType: 'company',
    entityId: company._id,
    summary: `Created company ${company.name}`,
    details: { stage: company.currentStage, isActive: company.isActive },
  });

  return apiResponse.success(res, { company }, 'Company created successfully', 201);
});

// ─── UPDATE COMPANY ───────────────────────────────────────────────────────────
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return apiResponse.error(res, 'Company not found', 404);

  const allowed = [
    'name', 'logo', 'description', 'sector', 'type',
    'ctc', 'roles', 'eligibility', 'documents',
    'applicationDeadline', 'websiteUrl', 'location', 'isActive',
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) company[field] = req.body[field];
  });

  // Guardrail: draft companies can stay hidden by marking inactive until announced.
  if (req.body.currentStage === 'draft') {
    company.currentStage = 'draft';
    company.isActive = false;
  }

  await company.save();

  await logCoordinatorAction({
    req,
    action: 'company.updated',
    entityType: 'company',
    entityId: company._id,
    summary: `Updated company ${company.name}`,
    details: { fieldsUpdated: Object.keys(req.body || {}) },
  });

  return apiResponse.success(res, { company }, 'Company updated');
});

// ─── UPDATE STAGE ─────────────────────────────────────────────────────────────
const updateStage = asyncHandler(async (req, res) => {
  const { stage, description, date } = req.body;

  if (!STAGES.includes(stage)) {
    return apiResponse.error(res, `Invalid stage. Must be one of: ${STAGES.join(', ')}`, 400);
  }

  const company = await Company.findById(req.params.id);
  if (!company) return apiResponse.error(res, 'Company not found', 404);

  if (company.currentStage !== stage) {
    const allowedNext = ALLOWED_STAGE_TRANSITIONS[company.currentStage] || [];
    if (!allowedNext.includes(stage)) {
      return apiResponse.error(
        res,
        `Invalid stage transition: ${company.currentStage} -> ${stage}`,
        400
      );
    }
  }

  company.currentStage = stage;
  if (stage === 'announced') company.isActive = true;
  if (stage === 'closed') company.isActive = false;
  company.timeline.push({
    stage,
    date: date ? new Date(date) : new Date(),
    description: description || `Moved to ${stage}`,
    updatedBy: req.user.id,
  });

  await company.save();
  await company.populate('timeline.updatedBy', 'name');

  await logCoordinatorAction({
    req,
    action: 'company.stage_updated',
    entityType: 'company',
    entityId: company._id,
    summary: `Moved ${company.name} to ${stage}`,
    details: {
      stage,
      description: description || '',
      date: date || null,
    },
  });

  return apiResponse.success(res, { company }, `Stage updated to ${stage}`);
});

// ─── DELETE COMPANY ───────────────────────────────────────────────────────────
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return apiResponse.error(res, 'Company not found', 404);

  // Soft delete
  company.isActive = false;
  await company.save();

  await logCoordinatorAction({
    req,
    action: 'company.deactivated',
    entityType: 'company',
    entityId: company._id,
    summary: `Deactivated company ${company.name}`,
  });

  return apiResponse.success(res, {}, 'Company removed');
});

// ─── BULK COMPANY ACTIONS ───────────────────────────────────────────────────
const bulkCompanyActions = asyncHandler(async (req, res) => {
  const { companyIds, action, stage } = req.body;

  if (!Array.isArray(companyIds) || !companyIds.length) {
    return apiResponse.error(res, 'companyIds array required', 400);
  }

  const companies = await Company.find({ _id: { $in: companyIds } });
  if (!companies.length) return apiResponse.error(res, 'No companies found', 404);

  if (action === 'activate') {
    await Company.updateMany({ _id: { $in: companyIds } }, { $set: { isActive: true } });
  } else if (action === 'close') {
    await Company.updateMany(
      { _id: { $in: companyIds } },
      {
        $set: { isActive: false, currentStage: 'closed' },
        $push: {
          timeline: {
            stage: 'closed',
            date: new Date(),
            description: 'Closed via bulk action',
            updatedBy: req.user.id,
          },
        },
      }
    );
  } else if (action === 'update_stage') {
    if (!stage || !STAGES.includes(stage)) {
      return apiResponse.error(res, 'Valid stage is required for update_stage action', 400);
    }

    const invalidTransition = companies.find((c) => {
      if (c.currentStage === stage) return false;
      const allowed = ALLOWED_STAGE_TRANSITIONS[c.currentStage] || [];
      return !allowed.includes(stage);
    });
    if (invalidTransition) {
      return apiResponse.error(
        res,
        `Invalid stage transition for ${invalidTransition.name}: ${invalidTransition.currentStage} -> ${stage}`,
        400
      );
    }

    await Company.updateMany(
      { _id: { $in: companyIds } },
      {
        $set: { currentStage: stage },
        $push: {
          timeline: {
            stage,
            date: new Date(),
            description: 'Stage updated via bulk action',
            updatedBy: req.user.id,
          },
        },
      }
    );
  } else {
    return apiResponse.error(res, 'Invalid bulk action', 400);
  }

  await logCoordinatorAction({
    req,
    action: 'company.bulk_action',
    entityType: 'company',
    summary: `Bulk action ${action} applied on ${companyIds.length} companies`,
    details: {
      action,
      stage: stage || null,
      companyIds,
      impactedCount: companyIds.length,
    },
  });

  return apiResponse.success(res, { updated: companyIds.length }, 'Bulk company action completed');
});

// ─── COORDINATOR WORKFLOW OVERVIEW ──────────────────────────────────────────
const getWorkflowOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    companies,
    pendingSlotCount,
  ] = await Promise.all([
    Company.find({}).sort({ applicationDeadline: 1 }).lean(),
    Application.countDocuments({
      status: { $in: ['shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3'] },
      isWithdrawn: false,
      $or: [{ 'interviewSlot.date': { $exists: false } }, { 'interviewSlot.date': null }],
    }),
  ]);

  const active = companies.filter((c) => c.isActive && c.currentStage !== 'closed' && c.currentStage !== 'draft').length;
  const closed = companies.filter((c) => c.currentStage === 'closed').length;
  const draft = companies.filter((c) => c.currentStage === 'draft').length;

  const upcomingDeadlines = companies
    .filter((c) => c.applicationDeadline && new Date(c.applicationDeadline) >= now && new Date(c.applicationDeadline) <= weekEnd)
    .slice(0, 8)
    .map((c) => ({
      _id: c._id,
      name: c.name,
      applicationDeadline: c.applicationDeadline,
      stage: c.currentStage,
    }));

  const missingDocuments = companies
    .filter((c) => c.isActive && (!Array.isArray(c.documents) || c.documents.length === 0))
    .slice(0, 8)
    .map((c) => ({
      _id: c._id,
      name: c.name,
      stage: c.currentStage,
      isActive: c.isActive,
    }));

  return apiResponse.success(res, {
    statusCounts: { active, closed, draft },
    upcomingDeadlines,
    missingDocuments,
    pendingShortlistActions: pendingSlotCount,
  });
});

// ─── GET STATS (for coordinator dashboard) ───────────────────────────────────
const getCompanyStats = asyncHandler(async (req, res) => {
  const stats = await Company.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$currentStage',
        count: { $sum: 1 },
        avgCtcMax: { $avg: '$ctc.max' },
      },
    },
  ]);

  const total = await Company.countDocuments({ isActive: true });
  return apiResponse.success(res, { stats, total });
});

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  updateStage,
  deleteCompany,
  bulkCompanyActions,
  getWorkflowOverview,
  getCompanyStats,
};
