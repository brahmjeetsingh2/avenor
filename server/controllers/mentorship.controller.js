const MentorshipRequest = require('../models/MentorshipRequest.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { notify } = require('../services/notification.service');

const canonicalCollege = (college = '') => {
  const STOP_WORDS = new Set([
    'institute',
    'university',
    'college',
    'school',
    'technology',
    'engineering',
    'science',
    'of',
    'the',
    'and',
  ]);

  return college
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
    .join(' ')
    .trim();
};

const isSameCollege = (a = '', b = '') => {
  const ca = canonicalCollege(a);
  const cb = canonicalCollege(b);
  if (!ca || !cb) return false;
  return ca === cb || ca.includes(cb) || cb.includes(ca);
};

const defaultMilestones = (topic = 'general') => {
  const topicLabel = topic.replace('_', ' ');
  return [
    { title: 'Intro connection and goal alignment', status: 'pending' },
    { title: `Deep-dive guidance on ${topicLabel}`, status: 'pending' },
    { title: 'Action plan and follow-up checkpoint', status: 'pending' },
  ];
};

const withSessionProgress = (request) => {
  const out = request.toObject ? request.toObject() : { ...request };
  const milestones = out.session?.milestones || [];
  const completed = milestones.filter((m) => m.status === 'completed').length;
  out.sessionProgress = {
    completed,
    total: milestones.length,
    percent: milestones.length ? Math.round((completed / milestones.length) * 100) : 0,
  };
  return out;
};

const createRequest = asyncHandler(async (req, res) => {
  const { alumniId, topic, message, preferredTime, referralId } = req.body;

  if (!alumniId || !message?.trim()) {
    return apiResponse.error(res, 'alumniId and message are required', 400);
  }

  const [student, alumni] = await Promise.all([
    User.findById(req.user.id).select('name role college').lean(),
    User.findById(alumniId).select('name role college alumniProfile').lean(),
  ]);

  if (!student || student.role !== 'student') {
    return apiResponse.error(res, 'Only students can create mentorship requests', 403);
  }

  if (!alumni || alumni.role !== 'alumni') {
    return apiResponse.error(res, 'Selected mentor is not an alumni account', 400);
  }

  const studentCollege = (student.college || '').trim();
  const alumniCollege = (alumni.college || '').trim();
  if (!studentCollege || !alumniCollege || !isSameCollege(studentCollege, alumniCollege)) {
    return apiResponse.error(res, 'Mentorship requests are only allowed within your college network', 403);
  }

  const openToMentorship = alumni.alumniProfile?.availability?.mentorship;
  if (openToMentorship === false) {
    return apiResponse.error(res, 'This alumni is currently not open to mentorship requests', 409);
  }

  const duplicatePending = await MentorshipRequest.findOne({
    student: req.user.id,
    alumni: alumniId,
    status: 'pending',
    isDeleted: false,
  });

  if (duplicatePending) {
    return apiResponse.error(res, 'You already have a pending request with this alumni', 409);
  }

  const request = await MentorshipRequest.create({
    student: req.user.id,
    alumni: alumniId,
    college: studentCollege,
    topic: topic || 'general',
    message: message.trim(),
    preferredTime: preferredTime?.trim() || '',
    referral: referralId || null,
    session: {
      isActive: false,
      milestones: [],
      updates: [
        {
          by: req.user.id,
          actorRole: 'student',
          message: 'Mentorship request created by student.',
        },
      ],
    },
  });

  await request.populate('student', 'name email branch batch');
  await request.populate('alumni', 'name email profilePic');

  await notify({
    recipients: alumniId,
    type: 'mentorship_request',
    title: 'New Mentorship Request',
    message: `${student.name} requested mentorship (${request.topic.replace('_', ' ')})`,
    data: {
      mentorshipRequestId: request._id,
      studentId: req.user.id,
      topic: request.topic,
    },
  });

  return apiResponse.success(res, { request: withSessionProgress(request) }, 'Mentorship request sent', 201);
});

const listStudentRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {
    student: req.user.id,
    isDeleted: false,
  };

  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [rows, total] = await Promise.all([
    MentorshipRequest.find(filter)
      .populate('alumni', 'name profilePic college alumniProfile.currentCompany alumniProfile.currentRole alumniProfile.linkedin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MentorshipRequest.countDocuments(filter),
  ]);

  return apiResponse.paginated(res, rows.map(withSessionProgress), {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)),
  });
});

const listAlumniInbox = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {
    alumni: req.user.id,
    isDeleted: false,
  };

  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [rows, total] = await Promise.all([
    MentorshipRequest.find(filter)
      .populate('student', 'name email branch batch college profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MentorshipRequest.countDocuments(filter),
  ]);

  return apiResponse.paginated(res, rows.map(withSessionProgress), {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)),
  });
});

const getMentorshipById = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate('student', 'name email branch batch college profilePic')
    .populate('alumni', 'name email profilePic college alumniProfile.currentCompany alumniProfile.currentRole alumniProfile.linkedin')
    .populate('session.updates.by', 'name role profilePic')
    .lean();

  if (!request) return apiResponse.error(res, 'Mentorship request not found', 404);

  const isStudent = request.student?._id?.toString() === req.user.id;
  const isAlumni = request.alumni?._id?.toString() === req.user.id;
  const isCoordinator = req.user.role === 'coordinator';
  if (!isStudent && !isAlumni && !isCoordinator) {
    return apiResponse.error(res, 'Forbidden', 403);
  }

  return apiResponse.success(res, { request: withSessionProgress(request) });
});

const updateMentorshipStatus = asyncHandler(async (req, res) => {
  const { status, responseNote, targetDate } = req.body;

  if (!['accepted', 'declined', 'completed'].includes(status)) {
    return apiResponse.error(res, 'Invalid status update', 400);
  }

  const request = await MentorshipRequest.findOne({
    _id: req.params.id,
    alumni: req.user.id,
    isDeleted: false,
  });

  if (!request) return apiResponse.error(res, 'Mentorship request not found', 404);

  request.status = status;
  request.responseNote = responseNote?.trim() || '';
  request.respondedAt = new Date();

  if (status === 'accepted') {
    const maybeTarget = targetDate ? new Date(targetDate) : null;
    request.session = {
      ...(request.session || {}),
      isActive: true,
      activatedAt: new Date(),
      targetDate: maybeTarget && !Number.isNaN(maybeTarget.getTime()) ? maybeTarget : null,
      milestones: request.session?.milestones?.length ? request.session.milestones : defaultMilestones(request.topic),
      updates: [
        ...(request.session?.updates || []),
        {
          by: req.user.id,
          actorRole: 'alumni',
          message: 'Mentorship request accepted. Session activated with milestones.',
        },
      ],
    };
  }

  if (status === 'declined') {
    request.session = {
      ...(request.session || {}),
      isActive: false,
      updates: [
        ...(request.session?.updates || []),
        {
          by: req.user.id,
          actorRole: 'alumni',
          message: 'Mentorship request declined.',
        },
      ],
    };
  }

  if (status === 'completed') {
    request.completedAt = new Date();
    request.session = {
      ...(request.session || {}),
      isActive: false,
      updates: [
        ...(request.session?.updates || []),
        {
          by: req.user.id,
          actorRole: 'alumni',
          message: 'Mentorship marked as completed.',
        },
      ],
    };
  }

  await request.save();

  await notify({
    recipients: request.student,
    type: 'mentorship_update',
    title: status === 'accepted' ? 'Mentorship Session Activated' : 'Mentorship Request Updated',
    message: status === 'accepted'
      ? 'Your alumni mentor accepted. Session milestones are ready.'
      : `Your mentorship request was ${status}`,
    data: {
      mentorshipRequestId: request._id,
      status,
      alumniId: req.user.id,
    },
  });

  return apiResponse.success(res, { request: withSessionProgress(request) }, 'Mentorship request updated');
});

const cancelStudentRequest = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findOne({
    _id: req.params.id,
    student: req.user.id,
    isDeleted: false,
  });

  if (!request) return apiResponse.error(res, 'Mentorship request not found', 404);

  if (!['pending', 'accepted'].includes(request.status)) {
    return apiResponse.error(res, 'Only pending or accepted requests can be cancelled', 409);
  }

  request.status = 'cancelled';
  request.respondedAt = new Date();
  request.session = {
    ...(request.session || {}),
    isActive: false,
    updates: [
      ...(request.session?.updates || []),
      {
        by: req.user.id,
        actorRole: 'student',
        message: 'Mentorship request cancelled by student.',
      },
    ],
  };
  await request.save();

  await notify({
    recipients: request.alumni,
    type: 'mentorship_update',
    title: 'Mentorship Request Cancelled',
    message: 'A student cancelled their mentorship request',
    data: {
      mentorshipRequestId: request._id,
      status: 'cancelled',
      studentId: req.user.id,
    },
  });

  return apiResponse.success(res, { request: withSessionProgress(request) }, 'Mentorship request cancelled');
});

const updateMilestoneStatus = asyncHandler(async (req, res) => {
  const { milestoneId } = req.params;
  const { status } = req.body;

  if (!['pending', 'completed'].includes(status)) {
    return apiResponse.error(res, 'Invalid milestone status', 400);
  }

  const request = await MentorshipRequest.findOne({
    _id: req.params.id,
    alumni: req.user.id,
    isDeleted: false,
  });

  if (!request) return apiResponse.error(res, 'Mentorship request not found', 404);
  if (!request.session?.isActive) return apiResponse.error(res, 'Session is not active', 409);

  const milestone = request.session.milestones.id(milestoneId);
  if (!milestone) return apiResponse.error(res, 'Milestone not found', 404);

  milestone.status = status;
  milestone.completedAt = status === 'completed' ? new Date() : null;

  request.session.updates = [
    ...(request.session.updates || []),
    {
      by: req.user.id,
      actorRole: 'alumni',
      message: `Milestone updated: ${milestone.title} -> ${status}`,
    },
  ];

  const allCompleted = request.session.milestones.every((m) => m.status === 'completed');
  if (allCompleted) {
    request.status = 'completed';
    request.completedAt = new Date();
    request.session.isActive = false;
  }

  await request.save();

  await notify({
    recipients: request.student,
    type: 'mentorship_update',
    title: 'Mentorship Progress Updated',
    message: `A mentorship milestone was marked ${status}`,
    data: {
      mentorshipRequestId: request._id,
      milestoneId,
      status,
    },
  });

  return apiResponse.success(res, { request: withSessionProgress(request) }, 'Milestone updated');
});

const addSessionUpdate = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return apiResponse.error(res, 'message is required', 400);

  const request = await MentorshipRequest.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!request) return apiResponse.error(res, 'Mentorship request not found', 404);

  const isStudent = request.student.toString() === req.user.id && req.user.role === 'student';
  const isAlumni = request.alumni.toString() === req.user.id && req.user.role === 'alumni';
  if (!isStudent && !isAlumni) return apiResponse.error(res, 'Forbidden', 403);

  request.session = {
    ...(request.session || {}),
    updates: [
      ...(request.session?.updates || []),
      {
        by: req.user.id,
        actorRole: isStudent ? 'student' : 'alumni',
        message: message.trim(),
      },
    ],
  };

  await request.save();

  await notify({
    recipients: isStudent ? request.alumni : request.student,
    type: 'mentorship_update',
    title: 'New Mentorship Update',
    message: 'A new update was posted in your mentorship session',
    data: {
      mentorshipRequestId: request._id,
    },
  });

  return apiResponse.success(res, { request: withSessionProgress(request) }, 'Session update added');
});

const deleteRequest = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findOne({
    _id: req.params.id,
    student: req.user.id,
    isDeleted: false,
  });

  if (!request) return apiResponse.error(res, 'Mentorship request not found', 404);

  request.isDeleted = true;
  request.deletedAt = new Date();
  await request.save();

  return apiResponse.success(res, { message: 'Mentorship request deleted' }, 200);
});

module.exports = {
  createRequest,
  listStudentRequests,
  listAlumniInbox,
  getMentorshipById,
  updateMentorshipStatus,
  updateMilestoneStatus,
  addSessionUpdate,
  cancelStudentRequest,
  deleteRequest,
};
