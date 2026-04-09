const Application = require('../models/Application.model');
const PlacementCycle = require('../models/PlacementCycle.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const coordinatorId = req.user.id;
  const { cycleId } = req.query;

  // Get coordinator's managed batches/colleges
  const coordinator = await User.findById(coordinatorId).select('coordinatorProfile');
  if (!coordinator?.coordinatorProfile?.managedCollege) {
    return apiResponse.error(res, 'Coordinator profile not complete', 400);
  }

  const filter = { status: { $ne: 'rejected' } };
  
  // If cycleId provided, filter by cycle dates
  if (cycleId) {
    const cycle = await PlacementCycle.findById(cycleId);
    if (!cycle) return apiResponse.error(res, 'Cycle not found', 404);
    // Filter applications by dates in cycle
  }

  const [
    applicationsByStage,
    companyStats,
    totalApplied,
    offersCount,
    rejectionCount,
  ] = await Promise.all([
    Application.aggregate([
      { $match: { status: { $ne: 'rejected' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { status: { $ne: 'rejected' } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'companyInfo' } },
    ]),
    Application.countDocuments(),
    Application.countDocuments({ status: 'offer' }),
    Application.countDocuments({ status: 'rejected' }),
  ]);

  // Calculate conversion rate
  const appliedCount = applicationsByStage.find(s => s._id === 'applied')?.count || 0;
  const shortlistedCount = applicationsByStage.find(s => s._id === 'shortlisted')?.count || 0;
  const conversionRate = appliedCount > 0 ? ((shortlistedCount / appliedCount) * 100).toFixed(1) : 0;

  return apiResponse.success(res, {
    stats: {
      totalApplications: totalApplied,
      totalOffers: offersCount,
      totalRejections: rejectionCount,
      conversionRate,
      applicationsByStage: applicationsByStage.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      topCompanies: companyStats.map(c => ({
        company: c.companyInfo[0]?.name || 'Unknown',
        companyId: c._id,
        applicationCount: c.count,
      })),
    },
  });
});

// ─── GET APPLICATIONS FUNNEL ──────────────────────────────────────────────────
const getApplicationFunnel = asyncHandler(async (req, res) => {
  const { status, company, search, limit = 50, page = 1 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (company) filter.company = company;
  if (search) {
    // Search by student name or email
    const students = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    filter.student = { $in: students.map(s => s._id) };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('student', 'name email batch branch')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(filter),
  ]);

  return apiResponse.success(res, {
    applications,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── UPDATE APPLICATION STATUS ───────────────────────────────────────────────
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, note, interviewSlot } = req.body;

  if (!status) {
    return apiResponse.error(res, 'status is required', 400);
  }

  const application = await Application.findById(applicationId);
  if (!application) return apiResponse.error(res, 'Application not found', 404);

  // Add to status history
  application.statusHistory.push({
    status,
    note: note || '',
    updatedBy: req.user.id,
  });

  application.status = status;

  if (interviewSlot) {
    application.interviewSlot = interviewSlot;
  }

  await application.save();
  await application.populate('student', 'name email').populate('company', 'name');

  return apiResponse.success(res, { application }, 'Status updated');
});

// ─── SEND BULK MESSAGE ───────────────────────────────────────────────────────
const sendBulkMessage = asyncHandler(async (req, res) => {
  const { studentIds, subject, message, type } = req.body;

  if (!studentIds?.length || !message || !subject) {
    return apiResponse.error(res, 'studentIds, subject, and message are required', 400);
  }

  // In production: use email service (SendGrid, AWS SES, etc.)
  // For now, create notifications
  const Notification = require('../models/Notification.model');

  const notifications = studentIds.map(studentId => ({
    user: studentId,
    title: subject,
    message,
    type: type || 'placement_update',
    isRead: false,
  }));

  await Notification.insertMany(notifications);

  return apiResponse.success(res, { count: notifications.length }, 'Messages sent');
});

// ─── GET PLACEMENT CYCLES ────────────────────────────────────────────────────
const getPlacementCycles = asyncHandler(async (req, res) => {
  const coordinatorId = req.user.id;
  const { college } = req.query;

  const filter = { coordinator: coordinatorId };
  if (college) filter.college = college;

  const cycles = await PlacementCycle.find(filter).sort({ startDate: -1 });

  return apiResponse.success(res, { cycles });
});

// ─── CREATE PLACEMENT CYCLE ──────────────────────────────────────────────────
const createPlacementCycle = asyncHandler(async (req, res) => {
  const { name, batchesEligible, college, startDate, endDate, targetCompanies, targetOffers, description } = req.body;

  if (!name || !college || !startDate || !endDate) {
    return apiResponse.error(res, 'name, college, startDate, and endDate are required', 400);
  }

  const cycle = await PlacementCycle.create({
    name,
    coordinator: req.user.id,
    batchesEligible: batchesEligible || [],
    college,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    targetCompanies: targetCompanies || 0,
    targetOffers: targetOffers || 0,
    description: description || '',
  });

  return apiResponse.success(res, { cycle }, 'Placement cycle created', 201);
});

// ─── UPDATE PLACEMENT CYCLE ──────────────────────────────────────────────────
const updatePlacementCycle = asyncHandler(async (req, res) => {
  const { cycleId } = req.params;
  const { status, targetOffers, targetCompanies, description } = req.body;

  const cycle = await PlacementCycle.findById(cycleId);
  if (!cycle) return apiResponse.error(res, 'Cycle not found', 404);

  if (status) cycle.status = status;
  if (targetOffers) cycle.targetOffers = targetOffers;
  if (targetCompanies) cycle.targetCompanies = targetCompanies;
  if (description !== undefined) cycle.description = description;

  await cycle.save();

  return apiResponse.success(res, { cycle }, 'Cycle updated');
});

// ─── GET SCHEDULED INTERVIEWS ────────────────────────────────────────────────
const getScheduledInterviews = asyncHandler(async (req, res) => {
  const { status = 'interview_r1', limit = 20, page = 1 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [interviews, total] = await Promise.all([
    Application.find({
      $or: [
        { status: 'test' },
        { status: 'interview_r1' },
        { status: 'interview_r2' },
        { status: 'interview_r3' },
      ],
      'interviewSlot.date': { $exists: true, $ne: null },
    })
      .populate('student', 'name email batch')
      .populate('company', 'name logo')
      .sort({ 'interviewSlot.date': 1 })
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments({
      $or: [
        { status: 'test' },
        { status: 'interview_r1' },
        { status: 'interview_r2' },
        { status: 'interview_r3' },
      ],
      'interviewSlot.date': { $exists: true, $ne: null },
    }),
  ]);

  return apiResponse.success(res, {
    interviews,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

module.exports = {
  getDashboardStats,
  getApplicationFunnel,
  updateApplicationStatus,
  sendBulkMessage,
  getPlacementCycles,
  createPlacementCycle,
  updatePlacementCycle,
  getScheduledInterviews,
};
