const Referral = require('../models/Referral.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { notify } = require('../services/notification.service');

const CLOSING_SOON_DAYS = 3;

const getActorProfile = async (userId) => User.findById(userId).select('college').lean();

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const collegeRegexFrom = (college = '') => {
  const normalized = college.trim().replace(/\s+/g, ' ');
  const pattern = normalized.split(' ').map(escapeRegExp).join('\\s+');
  return new RegExp(`^\\s*${pattern}\\s*$`, 'i');
};

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

const parseExpiryDate = (value) => {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getLifecycleStatus = (referral) => {
  if (referral.status === 'filled') return 'filled';
  if (referral.status === 'closed') return 'expired';
  if (referral.expiresAt && new Date(referral.expiresAt).getTime() < Date.now()) return 'expired';

  if (referral.status === 'active' && referral.expiresAt) {
    const cutoff = Date.now() + CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000;
    if (new Date(referral.expiresAt).getTime() <= cutoff) return 'closing_soon';
  }

  return 'active';
};

const toPublicReferral = (referral, includeEngagement = true) => {
  const out = referral.toObject ? referral.toObject() : referral;
  out.lifecycleStatus = getLifecycleStatus(out);

  if (!includeEngagement) {
    delete out.engagementEvents;
    delete out.saveCount;
    delete out.applyIntentCount;
    delete out.contactIntentCount;
  }

  return out;
};

const buildStatusFilter = (status) => {
  if (!status) return {};

  const now = new Date();
  const closingSoonCutoff = new Date(Date.now() + CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000);

  if (status === 'filled') return { status: 'filled' };
  if (status === 'expired') {
    return {
      $or: [
        { status: 'closed' },
        { status: 'active', expiresAt: { $lt: now } },
      ],
    };
  }
  if (status === 'closing_soon') {
    return {
      status: 'active',
      expiresAt: { $gte: now, $lte: closingSoonCutoff },
    };
  }

  return {
    status: 'active',
    $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
  };
};

const createReferral = asyncHandler(async (req, res) => {
  const {
    role,
    company,
    location,
    type,
    description,
    link,
    linkedin,
    expiresAt,
  } = req.body;

  if (!role?.trim() || !company?.trim()) {
    return apiResponse.error(res, 'role and company are required', 400);
  }

  const actor = await getActorProfile(req.user.id);
  const college = (actor?.college || '').trim();
  if (!college) {
    return apiResponse.error(res, 'Please complete your college in profile before posting referrals', 400);
  }

  const parsedExpiry = parseExpiryDate(expiresAt);
  if (expiresAt && !parsedExpiry) {
    return apiResponse.error(res, 'Invalid expiry date', 400);
  }

  const referral = await Referral.create({
    postedBy: req.user.id,
    college,
    role: role.trim(),
    company: company.trim(),
    location: location?.trim() || '',
    type: type || 'Full-time',
    description: description?.trim() || '',
    link: link?.trim() || '',
    linkedin: linkedin?.trim() || '',
    expiresAt: parsedExpiry,
  });

  await referral.populate('postedBy', 'name email profilePic college');

  const roughCollegeRegex = collegeRegexFrom(college);
  const recipients = await User.find({
    role: 'student',
    $or: [
      { college: { $regex: roughCollegeRegex } },
      { college: { $regex: /./ } },
    ],
  }).select('_id college').lean();
  const filteredRecipients = recipients.filter((u) => isSameCollege(u.college || '', college));
  if (filteredRecipients.length) {
    await notify({
      recipients: filteredRecipients.map((u) => u._id),
      type: 'referral_posted',
      title: 'New Alumni Referral Posted',
      message: `${referral.company} - ${referral.role}`,
      data: { referralId: referral._id, company: referral.company, role: referral.role },
    });
  }

  return apiResponse.success(
    res,
    { referral: toPublicReferral(referral) },
    'Referral posted and visible to students',
    201
  );
});

const listReferrals = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    company,
    status,
    sort = 'newest',
  } = req.query;

  const filter = { isDeleted: false, ...buildStatusFilter(status) };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    company: { company: 1, createdAt: -1 },
    location: { location: 1, createdAt: -1 },
    impact: { clicks: -1, saveCount: -1, applyIntentCount: -1, createdAt: -1 },
  };

  if (type) filter.type = type;
  if (company) filter.company = { $regex: company, $options: 'i' };
  if (req.query.location) filter.location = { $regex: req.query.location, $options: 'i' };

  if (req.user.role !== 'coordinator') {
    const actor = await getActorProfile(req.user.id);
    const college = (actor?.college || '').trim();
    if (college) {
      const referrals = await Referral.find(filter)
        .populate('postedBy', 'name profilePic linkedin alumniProfile.availability')
        .sort(sortMap[sort] || sortMap.newest)
        .lean();

      const scoped = referrals.filter((r) => isSameCollege(r.college || '', college));
      const skip = (Number(page) - 1) * Number(limit);
      const paged = scoped.slice(skip, skip + Number(limit));

      return apiResponse.paginated(
        res,
        paged.map((r) => toPublicReferral(r, false)),
        { page: Number(page), limit: Number(limit), total: scoped.length }
      );
    }

    return apiResponse.paginated(
      res,
      [],
      { page: Number(page), limit: Number(limit), total: 0 },
      'No college set on profile; referrals are scoped by college'
    );
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [rows, total] = await Promise.all([
    Referral.find(filter)
      .populate('postedBy', 'name profilePic linkedin alumniProfile.availability')
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Referral.countDocuments(filter),
  ]);

  return apiResponse.paginated(
    res,
    rows.map((r) => toPublicReferral(r, false)),
    { page: Number(page), limit: Number(limit), total }
  );
});

const getMyReferrals = asyncHandler(async (req, res) => {
  const { status, sort = 'newest' } = req.query;

  const filter = {
    postedBy: req.user.id,
    isDeleted: false,
    ...buildStatusFilter(status),
  };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    company: { company: 1, createdAt: -1 },
    impact: { clicks: -1, saveCount: -1, applyIntentCount: -1, createdAt: -1 },
  };

  const referrals = await Referral.find(filter)
    .populate('postedBy', 'name email profilePic college')
    .sort(sortMap[sort] || sortMap.newest)
    .lean();

  return apiResponse.success(res, {
    referrals: referrals.map((r) => toPublicReferral(r, true)),
  });
});

const updateReferral = asyncHandler(async (req, res) => {
  const referral = await Referral.findOne({ _id: req.params.id, isDeleted: false });
  if (!referral) return apiResponse.error(res, 'Referral not found', 404);

  const isOwner = referral.postedBy.toString() === req.user.id;
  const isCoordinator = req.user.role === 'coordinator';
  if (!isOwner && !isCoordinator) {
    return apiResponse.error(res, 'Forbidden', 403);
  }

  const editable = [
    'role',
    'company',
    'location',
    'type',
    'description',
    'link',
    'linkedin',
    'expiresAt',
    'status',
  ];

  for (const field of editable) {
    if (field in req.body) {
      if (field === 'expiresAt') {
        const parsedExpiry = parseExpiryDate(req.body.expiresAt);
        if (req.body.expiresAt && !parsedExpiry) {
          return apiResponse.error(res, 'Invalid expiry date', 400);
        }
        referral.expiresAt = parsedExpiry;
      } else {
        referral[field] = req.body[field];
      }
    }
  }

  if (referral.status === 'filled' && !referral.filledAt) referral.filledAt = new Date();
  if (referral.status !== 'filled') referral.filledAt = null;

  await referral.save();
  await referral.populate('postedBy', 'name email profilePic college');

  return apiResponse.success(res, { referral: toPublicReferral(referral) }, 'Referral updated');
});

const deleteReferral = asyncHandler(async (req, res) => {
  const referral = await Referral.findOne({ _id: req.params.id, isDeleted: false });
  if (!referral) return apiResponse.error(res, 'Referral not found', 404);

  const isOwner = referral.postedBy.toString() === req.user.id;
  const isCoordinator = req.user.role === 'coordinator';
  if (!isOwner && !isCoordinator) {
    return apiResponse.error(res, 'Forbidden', 403);
  }

  referral.isDeleted = true;
  await referral.save();

  return apiResponse.success(res, {}, 'Referral removed');
});

const trackReferralClick = asyncHandler(async (req, res) => {
  const referral = await Referral.findOne({ _id: req.params.id, isDeleted: false });
  if (!referral) return apiResponse.error(res, 'Referral not found', 404);

  referral.clicks += 1;
  referral.engagementEvents.push({ student: req.user.id, type: 'click' });
  await referral.save();

  await notify({
    recipients: referral.postedBy,
    type: 'referral_engagement',
    title: 'Referral Engagement',
    message: 'A student clicked your referral link',
    data: { referralId: referral._id, event: 'click' },
  });

  return apiResponse.success(res, { clicks: referral.clicks }, 'Tracked');
});

const trackReferralIntent = asyncHandler(async (req, res) => {
  const { type } = req.body;
  if (!['save', 'apply_intent', 'contact_intent'].includes(type)) {
    return apiResponse.error(res, 'Invalid intent type', 400);
  }

  const referral = await Referral.findOne({ _id: req.params.id, isDeleted: false });
  if (!referral) return apiResponse.error(res, 'Referral not found', 404);

  if (type === 'save') referral.saveCount += 1;
  if (type === 'apply_intent') referral.applyIntentCount += 1;
  if (type === 'contact_intent') referral.contactIntentCount += 1;

  referral.engagementEvents.push({ student: req.user.id, type });
  await referral.save();

  await notify({
    recipients: referral.postedBy,
    type: 'referral_engagement',
    title: 'Student Engagement Update',
    message: `A student marked ${type.replace('_', ' ')} on your referral`,
    data: { referralId: referral._id, event: type },
  });

  return apiResponse.success(res, {
    saveCount: referral.saveCount,
    applyIntentCount: referral.applyIntentCount,
    contactIntentCount: referral.contactIntentCount,
  });
});

module.exports = {
  createReferral,
  listReferrals,
  getMyReferrals,
  updateReferral,
  deleteReferral,
  trackReferralClick,
  trackReferralIntent,
};
