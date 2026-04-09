// const Application = require('../models/Application.model');
// const { notify } = require('../services/notification.service');
// const Company     = require('../models/Company.model');
// const asyncHandler = require('../utils/asyncHandler');
// const apiResponse  = require('../utils/apiResponse');

// const STATUSES = ['applied', 'shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3', 'offer', 'rejected'];

// // ─── APPLY TO COMPANY ─────────────────────────────────────────────────────────
// const applyToCompany = asyncHandler(async (req, res) => {
//   const { companyId } = req.body;

//   const company = await Company.findById(companyId);
//   if (!company)          return apiResponse.error(res, 'Company not found', 404);
//   if (!company.isActive) return apiResponse.error(res, 'This company is no longer active', 400);
//   if (company.currentStage === 'closed') return apiResponse.error(res, 'Applications are closed', 400);

//   const existing = await Application.findOne({ student: req.user.id, company: companyId });
//   if (existing) return apiResponse.error(res, 'You have already applied to this company', 409);

//   const application = await Application.create({
//     student: req.user.id,
//     company: companyId,
//     statusHistory: [{ status: 'applied', note: 'Application submitted', updatedBy: req.user.id }],
//   });

//   await application.populate(['company', { path: 'student', select: 'name email branch batch' }]);
//   return apiResponse.success(res, { application }, 'Application submitted successfully', 201);
// });

// // ─── GET MY APPLICATIONS (student) ───────────────────────────────────────────
// const getMyApplications = asyncHandler(async (req, res) => {
//   const { status, sortBy = 'createdAt', order = 'desc' } = req.query;
//   const filter = { student: req.user.id, isWithdrawn: false };
//   if (status) filter.status = status;

//   const applications = await Application.find(filter)
//     .populate('company', 'name logo sector type ctc currentStage applicationDeadline location roles')
//     .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
//     .lean();

//   return apiResponse.success(res, { applications });
// });

// // ─── GET APPLICATION BY ID ────────────────────────────────────────────────────
// const getApplicationById = asyncHandler(async (req, res) => {
//   const application = await Application.findById(req.params.id)
//     .populate('company', 'name logo sector type ctc currentStage applicationDeadline location roles')
//     .populate('statusHistory.updatedBy', 'name role');

//   if (!application) return apiResponse.error(res, 'Application not found', 404);

//   // Students can only view their own
//   if (req.user.role === 'student' && application.student.toString() !== req.user.id) {
//     return apiResponse.error(res, 'Forbidden', 403);
//   }

//   return apiResponse.success(res, { application });
// });

// // ─── GET APPLICATIONS BY COMPANY (coordinator) ───────────────────────────────
// const getApplicationsByCompany = asyncHandler(async (req, res) => {
//   const { companyId } = req.params;
//   const { status, search, page = 1, limit = 50 } = req.query;

//   const filter = { company: companyId, isWithdrawn: false };
//   if (status) filter.status = status;

//   let query = Application.find(filter)
//     .populate('student', 'name email branch batch college profilePic')
//     .populate('company', 'name logo')
//     .sort({ createdAt: -1 });

//   const [applications, total] = await Promise.all([
//     query.skip((page - 1) * limit).limit(Number(limit)).lean(),
//     Application.countDocuments(filter),
//   ]);

//   // Filter by search (name/email) after populate
//   const filtered = search
//     ? applications.filter((a) =>
//         a.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
//         a.student?.email?.toLowerCase().includes(search.toLowerCase())
//       )
//     : applications;

//   return apiResponse.paginated(res, filtered, { page: Number(page), limit: Number(limit), total });
// });

// // ─── UPDATE STATUS (coordinator) ─────────────────────────────────────────────
// const updateApplicationStatus = asyncHandler(async (req, res) => {
//   const { status, note, coordinatorNotes } = req.body;

//   if (!STATUSES.includes(status)) {
//     return apiResponse.error(res, 'Invalid status', 400);
//   }

//   const application = await Application.findById(req.params.id);
//   if (!application) return apiResponse.error(res, 'Application not found', 404);

//   // ✅ Capture student ID BEFORE populate overwrites it with an object
//   const studentId = application.student.toString();

//   application.status = status;
//   application.statusHistory.push({ status, note: note || '', updatedBy: req.user.id });
//   if (coordinatorNotes !== undefined) application.coordinatorNotes = coordinatorNotes;

//   await application.save();
//   await application.populate('company', 'name logo');
//   await application.populate('student', 'name email');

//   // Fire-and-forget notification to student
//   const statusLabels = {
//     shortlisted:  'You have been shortlisted! 🎯',
//     test:         'Test round scheduled',
//     interview_r1: 'Interview Round 1 scheduled',
//     interview_r2: 'Interview Round 2 scheduled',
//     interview_r3: 'Interview Round 3 scheduled',
//     offer:        'You received an offer! 🎉',
//     rejected:     'Application status updated',
//   };

//   // ✅ Map status to correct type matching TYPE_ICONS in useSocket.js
//   const statusTypeMap = {
//     shortlisted:  'shortlist',
//     test:         'status_update',
//     interview_r1: 'interview_slot',
//     interview_r2: 'interview_slot',
//     interview_r3: 'interview_slot',
//     offer:        'offer',
//     rejected:     'status_update',
//   };

//   notify({
//     recipients: [studentId], // ✅ plain string ID, not populated object
//     type: statusTypeMap[status] || 'status_update',
//     title: statusLabels[status] || 'Application Update',
//     message: `Your application to ${application.company?.name || 'a company'} has been updated`,
//     data: { applicationId: application._id, status },
//   }).catch(() => {});

//   return apiResponse.success(res, { application }, 'Status updated');
// });

// // ─── BULK UPDATE STATUS (coordinator) ────────────────────────────────────────
// const bulkUpdateStatus = asyncHandler(async (req, res) => {
//   const { applicationIds, status, note } = req.body;

//   if (!Array.isArray(applicationIds) || !applicationIds.length) {
//     return apiResponse.error(res, 'applicationIds array required', 400);
//   }
//   if (!STATUSES.includes(status)) {
//     return apiResponse.error(res, 'Invalid status', 400);
//   }

//   const historyEntry = { status, note: note || '', updatedBy: req.user.id, createdAt: new Date() };

//   await Application.updateMany(
//     { _id: { $in: applicationIds } },
//     {
//       $set:  { status },
//       $push: { statusHistory: historyEntry },
//     }
//   );

//   return apiResponse.success(res, { updated: applicationIds.length }, `${applicationIds.length} applications updated to ${status}`);
// });

// // ─── BOOK INTERVIEW SLOT ──────────────────────────────────────────────────────
// const bookInterviewSlot = asyncHandler(async (req, res) => {
//   const { applicationIds, date, time, mode, link, venue } = req.body;

//   if (!Array.isArray(applicationIds) || !applicationIds.length) {
//     return apiResponse.error(res, 'applicationIds array required', 400);
//   }

//   await Application.updateMany(
//     { _id: { $in: applicationIds } },
//     {
//       $set: {
//         interviewSlot: { date, time, mode: mode || 'online', link: link || '', venue: venue || '' },
//       },
//     }
//   );

//   return apiResponse.success(res, { booked: applicationIds.length }, 'Interview slots booked');
// });

// // ─── WITHDRAW APPLICATION (student) ──────────────────────────────────────────
// const withdrawApplication = asyncHandler(async (req, res) => {
//   const application = await Application.findOne({ _id: req.params.id, student: req.user.id });
//   if (!application) return apiResponse.error(res, 'Application not found', 404);
//   if (['offer', 'rejected'].includes(application.status)) {
//     return apiResponse.error(res, 'Cannot withdraw a finalised application', 400);
//   }

//   application.isWithdrawn = true;
//   application.statusHistory.push({ status: 'withdrawn', note: 'Withdrawn by student', updatedBy: req.user.id });
//   await application.save();

//   return apiResponse.success(res, {}, 'Application withdrawn');
// });

// // ─── GET MY STATS (student funnel) ───────────────────────────────────────────
// const getMyStats = asyncHandler(async (req, res) => {
//   const stats = await Application.aggregate([
//     { $match: { student: require('mongoose').Types.ObjectId.createFromHexString(req.user.id), isWithdrawn: false } },
//     { $group: { _id: '$status', count: { $sum: 1 } } },
//   ]);

//   const total = await Application.countDocuments({ student: req.user.id, isWithdrawn: false });
//   return apiResponse.success(res, { stats, total });
// });

// // ─── GET COMPANY FUNNEL STATS (coordinator) ───────────────────────────────────
// const getCompanyStats = asyncHandler(async (req, res) => {
//   const { companyId } = req.params;

//   const stats = await Application.aggregate([
//     { $match: { company: require('mongoose').Types.ObjectId.createFromHexString(companyId), isWithdrawn: false } },
//     { $group: { _id: '$status', count: { $sum: 1 } } },
//   ]);

//   const total = await Application.countDocuments({ company: companyId, isWithdrawn: false });
//   return apiResponse.success(res, { stats, total });
// });

// module.exports = {
//   applyToCompany,
//   getMyApplications,
//   getApplicationById,
//   getApplicationsByCompany,
//   updateApplicationStatus,
//   bulkUpdateStatus,
//   bookInterviewSlot,
//   withdrawApplication,
//   getMyStats,
//   getCompanyStats,
// };





















































const Application = require('../models/Application.model');
const { notify } = require('../services/notification.service');
const Company     = require('../models/Company.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse  = require('../utils/apiResponse');
const mongoose = require('mongoose');
const { logCoordinatorAction } = require('../services/audit.service');

const STATUSES = ['applied', 'shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3', 'offer', 'rejected'];

// ─── APPLY TO COMPANY ─────────────────────────────────────────────────────────
const applyToCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.body;

  const company = await Company.findById(companyId);
  if (!company)          return apiResponse.error(res, 'Company not found', 404);
  if (!company.isActive) return apiResponse.error(res, 'This company is no longer active', 400);
  if (company.currentStage === 'closed') return apiResponse.error(res, 'Applications are closed', 400);

  const existing = await Application.findOne({ student: req.user.id, company: companyId });
  if (existing && !existing.isWithdrawn) {
    return apiResponse.error(res, 'You have already applied to this company', 409);
  }

  if (existing?.isWithdrawn) {
    existing.isWithdrawn = false;
    existing.status = 'applied';
    existing.interviewSlot = {};
    existing.statusHistory.push({
      status: 'applied',
      note: 'Application re-submitted',
      updatedBy: req.user.id,
    });

    await existing.save();
    await existing.populate(['company', { path: 'student', select: 'name email branch batch' }]);

    return apiResponse.success(
      res,
      { application: existing },
      'Application re-submitted successfully'
    );
  }

  const application = await Application.create({
    student: req.user.id,
    company: companyId,
    statusHistory: [{ status: 'applied', note: 'Application submitted', updatedBy: req.user.id }],
  });

  await application.populate(['company', { path: 'student', select: 'name email branch batch' }]);
  return apiResponse.success(res, { application }, 'Application submitted successfully', 201);
});

// ─── GET MY APPLICATIONS (student) ───────────────────────────────────────────
const getMyApplications = asyncHandler(async (req, res) => {
  const { status, sortBy = 'createdAt', order = 'desc' } = req.query;
  const filter = { student: req.user.id, isWithdrawn: false };
  if (status) filter.status = status;

  const applications = await Application.find(filter)
    .populate('company', 'name logo sector type ctc currentStage applicationDeadline location roles')
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .lean();

  return apiResponse.success(res, { applications });
});

// ─── GET APPLICATION BY ID ────────────────────────────────────────────────────
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('company', 'name logo sector type ctc currentStage applicationDeadline location roles')
    .populate('statusHistory.updatedBy', 'name role');

  if (!application) return apiResponse.error(res, 'Application not found', 404);

  if (req.user.role === 'student' && application.student.toString() !== req.user.id) {
    return apiResponse.error(res, 'Forbidden', 403);
  }

  return apiResponse.success(res, { application });
});

// ─── GET APPLICATIONS BY COMPANY (coordinator) ───────────────────────────────
const getApplicationsByCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const {
    status,
    statusGroup,
    branch,
    batch,
    slotAssigned,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 50,
  } = req.query;

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(200, Math.max(10, Number(limit) || 50));
  const baseMatch = {
    company: mongoose.Types.ObjectId.createFromHexString(companyId),
    isWithdrawn: false,
  };

  const statusGroups = {
    active: ['applied', 'shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3'],
    shortlisted_pipeline: ['shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3'],
    offer_pending: ['shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3'],
    final: ['offer', 'rejected'],
    offer: ['offer'],
    rejected: ['rejected'],
    test_cleared: ['test', 'interview_r1', 'interview_r2', 'interview_r3', 'offer'],
  };

  if (status) baseMatch.status = status;
  if (!status && statusGroup && statusGroups[statusGroup]) {
    baseMatch.status = { $in: statusGroups[statusGroup] };
  }

  if (slotAssigned === 'assigned') {
    baseMatch['interviewSlot.date'] = { $exists: true, $ne: null };
  }
  if (slotAssigned === 'unassigned') {
    baseMatch.$or = [
      { 'interviewSlot.date': { $exists: false } },
      { 'interviewSlot.date': null },
    ];
  }

  const studentMatch = {};
  if (branch) studentMatch['student.branch'] = branch;
  if (batch) studentMatch['student.batch'] = batch;
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    studentMatch.$or = [
      { 'student.name': regex },
      { 'student.email': regex },
      { 'student.branch': regex },
    ];
  }

  const sortable = {
    name: 'student.name',
    batch: 'student.batch',
    branch: 'student.branch',
    appliedDate: 'createdAt',
    currentStatus: 'status',
    createdAt: 'createdAt',
  };
  const sortKey = sortable[sortBy] || 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;

  const pipeline = [
    { $match: baseMatch },
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'companies',
        localField: 'company',
        foreignField: '_id',
        as: 'company',
      },
    },
    { $unwind: '$company' },
  ];

  if (Object.keys(studentMatch).length) {
    pipeline.push({ $match: studentMatch });
  }

  pipeline.push(
    { $sort: { [sortKey]: sortOrder, _id: 1 } },
    {
      $facet: {
        data: [
          { $skip: (parsedPage - 1) * parsedLimit },
          { $limit: parsedLimit },
          {
            $project: {
              _id: 1,
              status: 1,
              coordinatorNotes: 1,
              createdAt: 1,
              updatedAt: 1,
              interviewSlot: 1,
              student: {
                _id: '$student._id',
                name: '$student.name',
                email: '$student.email',
                branch: '$student.branch',
                batch: '$student.batch',
                college: '$student.college',
                profilePic: '$student.profilePic',
              },
              company: {
                _id: '$company._id',
                name: '$company.name',
                logo: '$company.logo',
              },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    }
  );

  const [result] = await Application.aggregate(pipeline);
  const total = result?.total?.[0]?.count || 0;
  const applications = result?.data || [];

  return apiResponse.paginated(res, applications, {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages: Math.ceil(total / parsedLimit),
  });
});

// ─── UPDATE STATUS (coordinator) ─────────────────────────────────────────────
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note, coordinatorNotes } = req.body;

  if (!STATUSES.includes(status)) {
    return apiResponse.error(res, 'Invalid status', 400);
  }

  const application = await Application.findById(req.params.id);
  if (!application) return apiResponse.error(res, 'Application not found', 404);

  // Capture student ID BEFORE populate overwrites it with an object
  const studentId = application.student.toString();

  application.status = status;
  application.statusHistory.push({ status, note: note || '', updatedBy: req.user.id });
  if (coordinatorNotes !== undefined) application.coordinatorNotes = coordinatorNotes;

  await application.save();
  await application.populate('company', 'name logo');
  await application.populate('student', 'name email');

  const statusLabels = {
    shortlisted:  'You have been shortlisted! 🎯',
    test:         'Test round scheduled',
    interview_r1: 'Interview Round 1 scheduled',
    interview_r2: 'Interview Round 2 scheduled',
    interview_r3: 'Interview Round 3 scheduled',
    offer:        'You received an offer! 🎉',
    rejected:     'Application status updated',
  };

  const statusTypeMap = {
    shortlisted:  'shortlist',
    test:         'status_update',
    interview_r1: 'interview_slot',
    interview_r2: 'interview_slot',
    interview_r3: 'interview_slot',
    offer:        'offer',
    rejected:     'status_update',
  };

  notify({
    recipients: [studentId],
    type: statusTypeMap[status] || 'status_update',
    title: statusLabels[status] || 'Application Update',
    message: `Your application to ${application.company?.name || 'a company'} has been updated`,
    data: { applicationId: application._id, status },
  }).catch(() => {});

  await logCoordinatorAction({
    req,
    action: 'shortlist.status_updated',
    entityType: 'application',
    entityId: application._id,
    summary: `Updated ${application.student?.name || 'student'} to ${status}`,
    details: {
      companyId: application.company?._id,
      companyName: application.company?.name,
      status,
      note: note || '',
    },
  });

  return apiResponse.success(res, { application }, 'Status updated');
});

// ─── BULK UPDATE STATUS (coordinator) ────────────────────────────────────────
const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { applicationIds, status, note } = req.body;

  if (!Array.isArray(applicationIds) || !applicationIds.length) {
    return apiResponse.error(res, 'applicationIds array required', 400);
  }
  if (!STATUSES.includes(status)) {
    return apiResponse.error(res, 'Invalid status', 400);
  }

  const historyEntry = { status, note: note || '', updatedBy: req.user.id, createdAt: new Date() };

  await Application.updateMany(
    { _id: { $in: applicationIds } },
    {
      $set:  { status },
      $push: { statusHistory: historyEntry },
    }
  );

  // ✅ Fetch applications with student + company to send notifications
  const applications = await Application.find(
    { _id: { $in: applicationIds } },
    { student: 1, company: 1 }
  ).populate('company', 'name').lean();

  const statusLabels = {
    shortlisted:  'You have been shortlisted! 🎯',
    test:         'Test round scheduled',
    interview_r1: 'Interview Round 1 scheduled',
    interview_r2: 'Interview Round 2 scheduled',
    interview_r3: 'Interview Round 3 scheduled',
    offer:        'You received an offer! 🎉',
    rejected:     'Application status updated',
  };

  const statusTypeMap = {
    shortlisted:  'shortlist',
    test:         'status_update',
    interview_r1: 'interview_slot',
    interview_r2: 'interview_slot',
    interview_r3: 'interview_slot',
    offer:        'offer',
    rejected:     'status_update',
  };

  // Notify each student individually
  for (const app of applications) {
    notify({
      recipients: [app.student.toString()],
      type: statusTypeMap[status] || 'status_update',
      title: statusLabels[status] || 'Application Update',
      message: `Your application to ${app.company?.name || 'a company'} has been updated`,
      data: { applicationId: app._id, status },
    }).catch(() => {});
  }

  await logCoordinatorAction({
    req,
    action: 'shortlist.bulk_status_updated',
    entityType: 'application',
    summary: `Bulk updated ${applicationIds.length} applications to ${status}`,
    details: {
      applicationIds,
      status,
      note: note || '',
      impactedCount: applicationIds.length,
    },
  });

  return apiResponse.success(res, { updated: applicationIds.length }, `${applicationIds.length} applications updated to ${status}`);
});

// ─── BOOK INTERVIEW SLOT ──────────────────────────────────────────────────────
const bookInterviewSlot = asyncHandler(async (req, res) => {
  const { applicationIds, date, time, mode, link, venue } = req.body;

  if (!Array.isArray(applicationIds) || !applicationIds.length) {
    return apiResponse.error(res, 'applicationIds array required', 400);
  }

  await Application.updateMany(
    { _id: { $in: applicationIds } },
    {
      $set: {
        interviewSlot: { date, time, mode: mode || 'online', link: link || '', venue: venue || '' },
      },
    }
  );

  await logCoordinatorAction({
    req,
    action: 'shortlist.bulk_slot_assigned',
    entityType: 'application',
    summary: `Assigned interview slots for ${applicationIds.length} applications`,
    details: {
      applicationIds,
      date,
      time,
      mode: mode || 'online',
      impactedCount: applicationIds.length,
    },
  });

  return apiResponse.success(res, { booked: applicationIds.length }, 'Interview slots booked');
});

// ─── UPDATE COORDINATOR NOTES (coordinator) ──────────────────────────────────
const updateCoordinatorNotes = asyncHandler(async (req, res) => {
  const { coordinatorNotes = '' } = req.body;

  const application = await Application.findById(req.params.id)
    .populate('student', 'name email')
    .populate('company', 'name');
  if (!application) return apiResponse.error(res, 'Application not found', 404);

  application.coordinatorNotes = String(coordinatorNotes);
  await application.save();

  await logCoordinatorAction({
    req,
    action: 'shortlist.notes_updated',
    entityType: 'application',
    entityId: application._id,
    summary: `Updated coordinator notes for ${application.student?.name || 'application'}`,
    details: {
      companyName: application.company?.name,
      studentEmail: application.student?.email,
    },
  });

  return apiResponse.success(res, { application }, 'Coordinator notes updated');
});

// ─── WITHDRAW APPLICATION (student) ──────────────────────────────────────────
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, student: req.user.id });
  if (!application) return apiResponse.error(res, 'Application not found', 404);
  if (['offer', 'rejected'].includes(application.status)) {
    return apiResponse.error(res, 'Cannot withdraw a finalised application', 400);
  }

  application.isWithdrawn = true;
  application.statusHistory.push({ status: 'withdrawn', note: 'Withdrawn by student', updatedBy: req.user.id });
  await application.save();

  return apiResponse.success(res, {}, 'Application withdrawn');
});

// ─── GET MY STATS (student funnel) ───────────────────────────────────────────
const getMyStats = asyncHandler(async (req, res) => {
  const stats = await Application.aggregate([
    { $match: { student: require('mongoose').Types.ObjectId.createFromHexString(req.user.id), isWithdrawn: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const total = await Application.countDocuments({ student: req.user.id, isWithdrawn: false });
  return apiResponse.success(res, { stats, total });
});

// ─── GET COMPANY FUNNEL STATS (coordinator) ───────────────────────────────────
const getCompanyStats = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const stats = await Application.aggregate([
    { $match: { company: require('mongoose').Types.ObjectId.createFromHexString(companyId), isWithdrawn: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const total = await Application.countDocuments({ company: companyId, isWithdrawn: false });
  return apiResponse.success(res, { stats, total });
});

module.exports = {
  applyToCompany,
  getMyApplications,
  getApplicationById,
  getApplicationsByCompany,
  updateApplicationStatus,
  bulkUpdateStatus,
  bookInterviewSlot,
  updateCoordinatorNotes,
  withdrawApplication,
  getMyStats,
  getCompanyStats,
};
