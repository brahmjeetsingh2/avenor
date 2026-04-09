const Notification  = require('../models/Notification.model');
const Announcement = require('../models/Announcement.model');
const User          = require('../models/User.model');
const asyncHandler  = require('../utils/asyncHandler');
const apiResponse   = require('../utils/apiResponse');
const { announceToStudents } = require('../services/notification.service');
const { logCoordinatorAction } = require('../services/audit.service');

const ANNOUNCEMENT_TEMPLATES = [
  {
    key: 'shortlist_update',
    label: 'Shortlist Update',
    title: 'Shortlist Released for {{company}}',
    message: 'The shortlist for {{company}} has been published. Please check your profile and confirm your availability for further rounds.',
  },
  {
    key: 'interview_schedule',
    label: 'Interview Schedule',
    title: 'Interview Slots Assigned - {{company}}',
    message: 'Interview schedule is now live for {{company}}. Please check slot date, time, and venue details immediately.',
  },
  {
    key: 'deadline_reminder',
    label: 'Deadline Reminder',
    title: 'Deadline Reminder - {{company}} Applications',
    message: 'Last reminder: applications for {{company}} close on {{deadline}}. Submit your application before the cutoff.',
  },
  {
    key: 'document_submission_reminder',
    label: 'Document Submission Reminder',
    title: 'Pending Document Submission',
    message: 'Please upload pending placement documents at the earliest to avoid shortlist rejection in upcoming drives.',
  },
];

const buildAudienceFilter = (body = {}, college = '') => {
  const { target = 'all', branch, batch } = body;
  const filter = { role: 'student' };

  if (college) filter.college = college;
  if (target === 'branch' || target === 'branch_batch') {
    if (branch) filter.branch = branch;
  }
  if (target === 'batch' || target === 'branch_batch') {
    if (batch) filter.batch = batch;
  }

  return filter;
};

const loadCoordinatorContext = async (userId) => {
  const user = await User.findById(userId).select('college coordinatorProfile').lean();
  return user || { college: '', coordinatorProfile: null };
};

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, unread } = req.query;
  const filter = { recipient: req.user.id };
  if (type)            filter.type   = type;
  if (unread === 'true') filter.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return apiResponse.paginated(res, notifications, {
    page: Number(page), limit: Number(limit), total,
    pages: Math.ceil(total / Number(limit)),
  });
});

// ─── GET UNREAD COUNT ─────────────────────────────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  return apiResponse.success(res, { count });
});

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true, readAt: new Date() }
  );
  return apiResponse.success(res, {}, 'Marked as read');
});

// ─── MARK ALL READ ────────────────────────────────────────────────────────────
const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return apiResponse.success(res, { updated: result.modifiedCount }, 'All notifications marked as read');
});

// ─── COORDINATOR BULK ANNOUNCE ────────────────────────────────────────────────
const bulkAnnounce = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    target = 'all',
    branch,
    batch,
    format = 'plain',
    templateKey = '',
    sendMode = 'now',
    scheduledFor,
  } = req.body;

  if (!title?.trim() || !message?.trim()) {
    return apiResponse.error(res, 'Title and message are required', 400);
  }

  if (target === 'branch' && !branch) {
    return apiResponse.error(res, 'Branch is required for branch targeting', 400);
  }
  if (target === 'batch' && !batch) {
    return apiResponse.error(res, 'Batch is required for batch targeting', 400);
  }
  if (target === 'branch_batch' && (!branch || !batch)) {
    return apiResponse.error(res, 'Branch and batch are required for combined targeting', 400);
  }

  let scheduledDate = null;
  if (sendMode === 'later') {
    if (!scheduledFor) {
      return apiResponse.error(res, 'scheduledFor is required when sendMode is later', 400);
    }
    scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return apiResponse.error(res, 'Scheduled time must be in the future', 400);
    }
  }

  const coordinator = await loadCoordinatorContext(req.user.id);
  const filter = buildAudienceFilter({ target, branch, batch }, coordinator.college || '');
  const targetCount = await User.countDocuments(filter);

  const announcement = await Announcement.create({
    title: title.trim(),
    message: message.trim(),
    format,
    templateKey,
    targetType: target,
    target: {
      college: coordinator.college || '',
      branch: branch || '',
      batch: batch || '',
    },
    createdBy: req.user.id,
    status: sendMode === 'later' ? 'scheduled' : 'sending',
    deliveryStatus: sendMode === 'later' ? 'scheduled' : 'not_started',
    targetCount,
    scheduledFor: scheduledDate,
    meta: { sentBy: req.user.id },
  });

  let delayMs = 0;
  if (sendMode === 'later') {
    delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
  }

  const count = await announceToStudents({
    title: title.trim(),
    message: message.trim(),
    data: {
      from: req.user.id,
      type: 'announcement',
      announcementId: announcement._id,
      templateKey,
    },
    filter,
    delayMs,
  });

  if (count === 0) {
    announcement.status = 'failed';
    announcement.deliveryStatus = 'failed';
    announcement.lastError = 'No matching students found for selected audience.';
    await announcement.save();
  }

  await logCoordinatorAction({
    req,
    action: sendMode === 'later' ? 'announcement.scheduled' : 'announcement.sent',
    entityType: 'announcement',
    entityId: announcement._id,
    summary: `${sendMode === 'later' ? 'Scheduled' : 'Sent'} announcement to ${count} students`,
    details: {
      target,
      branch: branch || '',
      batch: batch || '',
      targetCount: count,
      sendMode,
      scheduledFor: sendMode === 'later' ? scheduledFor : null,
    },
  });

  return apiResponse.success(
    res,
    { recipients: count, announcement },
    sendMode === 'later'
      ? `Announcement scheduled for ${count} students`
      : `Announcement queued for ${count} students`
  );
});

const previewAnnouncementAudience = asyncHandler(async (req, res) => {
  const coordinator = await loadCoordinatorContext(req.user.id);
  const filter = buildAudienceFilter(req.body, coordinator.college || '');
  const count = await User.countDocuments(filter);
  return apiResponse.success(res, { count });
});

const getAnnouncementTemplates = asyncHandler(async (_req, res) => {
  return apiResponse.success(res, { templates: ANNOUNCEMENT_TEMPLATES });
});

const getAnnouncementHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status, targetType, search, sentFrom, sentTo } = req.query;

  const filter = { createdBy: req.user.id };
  if (status) filter.status = status;
  if (targetType) filter.targetType = targetType;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }
  if (sentFrom || sentTo) {
    filter.createdAt = {};
    if (sentFrom) filter.createdAt.$gte = new Date(sentFrom);
    if (sentTo) filter.createdAt.$lte = new Date(sentTo);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [history, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Announcement.countDocuments(filter),
  ]);

  return apiResponse.paginated(res, history, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)),
  });
});

const cloneAnnouncementAsDraft = asyncHandler(async (req, res) => {
  const source = await Announcement.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!source) return apiResponse.error(res, 'Announcement not found', 404);

  const draft = await Announcement.create({
    title: source.title,
    message: source.message,
    format: source.format,
    templateKey: source.templateKey || '',
    targetType: source.targetType,
    target: source.target,
    createdBy: req.user.id,
    status: 'draft',
    deliveryStatus: 'not_started',
    targetCount: source.targetCount || 0,
    meta: {
      sourceAnnouncementId: source._id,
      sentBy: req.user.id,
    },
  });

  await logCoordinatorAction({
    req,
    action: 'announcement.duplicated',
    entityType: 'announcement',
    entityId: draft._id,
    summary: 'Created announcement draft from history',
    details: { sourceAnnouncementId: source._id },
  });

  return apiResponse.success(res, { draft }, 'Draft created from announcement');
});

// ─── DELETE NOTIFICATION ──────────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
  return apiResponse.success(res, {}, 'Notification deleted');
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  bulkAnnounce,
  previewAnnouncementAudience,
  getAnnouncementTemplates,
  getAnnouncementHistory,
  cloneAnnouncementAsDraft,
  deleteNotification,
};
