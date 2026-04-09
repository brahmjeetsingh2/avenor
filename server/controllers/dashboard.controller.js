const mongoose    = require('mongoose');
const Application = require('../models/Application.model');
const User        = require('../models/User.model');
const Company     = require('../models/Company.model');
const Offer       = require('../models/Offer.model');
const Experience  = require('../models/Experience.model');
const Salary      = require('../models/Salary.model');
const Referral    = require('../models/Referral.model');
const Announcement = require('../models/Announcement.model');
const AuditLog    = require('../models/AuditLog.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse  = require('../utils/apiResponse');
const { getRedis } = require('../config/redis');

const CACHE_TTL = 600; // 10 minutes

const cached = async (key, fn) => {
  const redis = getRedis();
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) return JSON.parse(hit);
    } catch {}
  }
  const result = await fn();
  if (redis) {
    try { await redis.setex(key, CACHE_TTL, JSON.stringify(result)); } catch {}
  }
  return result;
};

// ─── PLACEMENT STATS (KPI row) ────────────────────────────────────────────────
const getPlacementStats = asyncHandler(async (req, res) => {
  const { year } = req.query;

  const data = await cached(`dashboard:stats:${year || 'all'}`, async () => {
    const appMatch = { isWithdrawn: false };
    const offerMatch = {};
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end   = new Date(`${Number(year) + 1}-01-01`);
      appMatch.createdAt  = { $gte: start, $lt: end };
      offerMatch.createdAt = { $gte: start, $lt: end };
    }

    const [
      totalStudents,
      totalCompanies,
      placedStudents,
      ctcStats,
      offerCount,
      appCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Company.countDocuments({ isActive: true }),
      Application.distinct('student', { ...appMatch, status: 'offer' }),
      Offer.aggregate([
        { $match: offerMatch },
        { $group: { _id: null, avg: { $avg: '$ctc' }, max: { $max: '$ctc' }, total: { $sum: 1 } } },
      ]),
      Offer.countDocuments(offerMatch),
      Application.countDocuments(appMatch),
    ]);

    const avgCTC = ctcStats[0]?.avg || 0;
    const maxCTC = ctcStats[0]?.max || 0;
    const placed = placedStudents.length;
    const placedPct = totalStudents > 0 ? ((placed / totalStudents) * 100).toFixed(1) : 0;

    return { totalStudents, placed, placedPct, avgCTC: avgCTC.toFixed(2), maxCTC, totalCompanies, offerCount, appCount };
  });

  return apiResponse.success(res, data);
});

// ─── COMPANY FUNNEL ───────────────────────────────────────────────────────────
const getCompanyFunnel = asyncHandler(async (req, res) => {
  const data = await cached('dashboard:funnel', async () => {
    const funnel = await Application.aggregate([
      { $match: { isWithdrawn: false } },
      {
        $group: {
          _id:         { company: '$company', status: '$status' },
          count:       { $sum: 1 },
        },
      },
      {
        $group: {
          _id:      '$_id.company',
          statuses: { $push: { status: '$_id.status', count: '$count' } },
          total:    { $sum: '$count' },
        },
      },
      {
        $lookup: {
          from: 'companies', localField: '_id', foreignField: '_id', as: 'company',
        },
      },
      { $unwind: '$company' },
      { $match: { 'company.isActive': true } },
      {
        $project: {
          name:     '$company.name',
          logo:     '$company.logo',
          sector:   '$company.sector',
          statuses: 1,
          total:    1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 20 },
    ]);

    // Pivot statuses array into an object
    return funnel.map((f) => {
      const pivot = { applied: 0, shortlisted: 0, test: 0, offer: 0, rejected: 0 };
      f.statuses.forEach((s) => {
        if (s.status === 'interview_r1' || s.status === 'interview_r2' || s.status === 'interview_r3') {
          pivot.test = (pivot.test || 0) + s.count;
        } else {
          pivot[s.status] = s.count;
        }
      });
      return { _id: f._id, name: f.name, logo: f.logo, sector: f.sector, total: f.total, ...pivot };
    });
  });

  return apiResponse.success(res, { funnel: data });
});

// ─── BRANCH-WISE STATS ────────────────────────────────────────────────────────
const getBatchStats = asyncHandler(async (req, res) => {
  const data = await cached('dashboard:batch', async () => {
    const [branchStudents, branchPlaced] = await Promise.all([
      User.aggregate([
        { $match: { role: 'student', branch: { $ne: '' } } },
        { $group: { _id: '$branch', total: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { status: 'offer', isWithdrawn: false } },
        {
          $lookup: {
            from: 'users', localField: 'student', foreignField: '_id', as: 'student',
          },
        },
        { $unwind: '$student' },
        { $match: { 'student.branch': { $ne: '' } } },
        { $group: { _id: '$student.branch', placed: { $sum: 1 } } },
      ]),
    ]);

    const placedMap = Object.fromEntries(branchPlaced.map((b) => [b._id, b.placed]));
    return branchStudents.map((b) => ({
      branch:  b._id,
      total:   b.total,
      placed:  placedMap[b._id] || 0,
      pct:     b.total > 0 ? ((placedMap[b._id] || 0) / b.total * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.total - a.total);
  });

  return apiResponse.success(res, { branches: data });
});

// ─── MONTHLY TIMELINE ─────────────────────────────────────────────────────────
const getTimelineData = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const data = await cached(`dashboard:timeline:${year}`, async () => {
    const start = new Date(`${year}-01-01`);
    const end   = new Date(`${Number(year) + 1}-01-01`);

    const monthly = await Application.aggregate([
      { $match: { isWithdrawn: false, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            month:  { $month: '$createdAt' },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const timeline = months.map((name, i) => {
      const month = i + 1;
      const rows  = monthly.filter((r) => r._id.month === month);
      const get   = (s) => rows.find((r) => r._id.status === s)?.count || 0;
      return {
        name,
        applied:     get('applied'),
        shortlisted: get('shortlisted'),
        offers:      get('offer'),
        rejected:    get('rejected'),
      };
    });

    return timeline;
  });

  return apiResponse.success(res, { timeline: data });
});

// ─── RECENT ACTIVITY ──────────────────────────────────────────────────────────
const getRecentActivity = asyncHandler(async (req, res) => {
  const recent = await Application.find({ isWithdrawn: false })
    .populate('student', 'name branch profilePic')
    .populate('company', 'name logo')
    .sort({ updatedAt: -1 })
    .limit(15)
    .lean();

  return apiResponse.success(res, { activity: recent });
});

// ─── COORDINATOR OPERATIONS SNAPSHOT ───────────────────────────────────────
const getCoordinatorOperations = asyncHandler(async (req, res) => {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const coordinator = await User.findById(req.user.id).select('college coordinatorProfile').lean();

  const [companies, pendingSlotCount, latestAnnouncements, lowConversion, recentActions] = await Promise.all([
    Company.find({}).sort({ applicationDeadline: 1 }).limit(100).lean(),
    Application.countDocuments({
      status: { $in: ['shortlisted', 'test', 'interview_r1', 'interview_r2', 'interview_r3'] },
      isWithdrawn: false,
      $or: [{ 'interviewSlot.date': { $exists: false } }, { 'interviewSlot.date': null }],
    }),
    Announcement.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).limit(5).lean(),
    Application.aggregate([
      { $match: { isWithdrawn: false } },
      {
        $group: {
          _id: '$company',
          shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ['$status', 'offer'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      {
        $project: {
          _id: 1,
          name: '$company.name',
          shortlisted: 1,
          offers: 1,
          conversion: {
            $cond: [{ $gt: ['$shortlisted', 0] }, { $divide: ['$offers', '$shortlisted'] }, 0],
          },
        },
      },
      { $match: { shortlisted: { $gte: 5 }, conversion: { $lt: 0.1 } } },
      { $sort: { conversion: 1 } },
      { $limit: 5 },
    ]),
    AuditLog.find({ actor: req.user.id }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const companiesNeedingAttention = companies
    .filter((c) => c.isActive && c.currentStage !== 'closed' && c.currentStage !== 'draft')
    .filter((c) => {
      const missingDeadline = !c.applicationDeadline;
      const deadlinePassed = c.applicationDeadline && new Date(c.applicationDeadline) < now;
      const missingDocuments = !c.documents?.length;
      return missingDeadline || deadlinePassed || missingDocuments;
    })
    .slice(0, 8)
    .map((c) => ({
      _id: c._id,
      name: c.name,
      stage: c.currentStage,
      applicationDeadline: c.applicationDeadline,
      missingDocuments: !c.documents?.length,
    }));

  const deadlinesThisWeek = companies
    .filter((c) => c.applicationDeadline && new Date(c.applicationDeadline) >= now && new Date(c.applicationDeadline) <= weekEnd)
    .slice(0, 8)
    .map((c) => ({
      _id: c._id,
      name: c.name,
      deadline: c.applicationDeadline,
      stage: c.currentStage,
    }));

  const operationalAlerts = [
    ...companies
      .filter((c) => c.isActive && !c.applicationDeadline)
      .slice(0, 5)
      .map((c) => ({
        type: 'missing_deadline',
        companyId: c._id,
        companyName: c.name,
        message: `${c.name} has no application deadline configured`,
      })),
    ...lowConversion.map((c) => ({
      type: 'low_conversion',
      companyId: c._id,
      companyName: c.name,
      message: `${c.name} shortlist-to-offer conversion is low`,
      conversion: Number((c.conversion * 100).toFixed(1)),
    })),
  ].slice(0, 10);

  return apiResponse.success(res, {
    widgets: {
      companiesNeedingAttention,
      deadlinesThisWeek,
      shortlistedAwaitingSlots: pendingSlotCount,
      latestAnnouncements,
    },
    operationalAlerts,
    coordinatorProfile: {
      managedCollege: coordinator?.coordinatorProfile?.managedCollege || coordinator?.college || '',
      managedBranches: coordinator?.coordinatorProfile?.managedBranches || [],
      managedBatches: coordinator?.coordinatorProfile?.managedBatches || [],
      capabilities: coordinator?.coordinatorProfile?.capabilities || [],
      recentActions: recentActions.map((a) => ({
        _id: a._id,
        action: a.action,
        summary: a.summary,
        createdAt: a.createdAt,
      })),
    },
  });
});

// ─── ALUMNI IMPACT DASHBOARD ────────────────────────────────────────────────
const getAlumniImpact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const key = `dashboard:alumni:${userId}`;

  const data = await cached(key, async () => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      experienceCount,
      salaryCount,
      referrals,
      experiences,
      salaries,
    ] = await Promise.all([
      Experience.countDocuments({ author: userId, isDeleted: false }),
      Salary.countDocuments({ submittedBy: userId, isDeleted: false }),
      Referral.find({ postedBy: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .lean(),
      Experience.find({ author: userId, isDeleted: false })
        .populate('company', 'name logo')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Salary.find({ submittedBy: userId, isDeleted: false })
        .populate('company', 'name logo')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const referralCount = referrals.length;
    const totalClicks = referrals.reduce((sum, r) => sum + (r.clicks || 0), 0);
    const totalIntent = referrals.reduce(
      (sum, r) => sum + (r.saveCount || 0) + (r.applyIntentCount || 0) + (r.contactIntentCount || 0),
      0
    );

    const uniqueStudentsMonth = new Set();
    referrals.forEach((r) => {
      (r.engagementEvents || []).forEach((e) => {
        if (new Date(e.createdAt) >= monthStart) {
          uniqueStudentsMonth.add(String(e.student));
        }
      });
    });

    const companySet = new Set();
    experiences.forEach((e) => {
      if (e.company?.name) companySet.add(e.company.name.toLowerCase());
    });
    salaries.forEach((s) => {
      if (s.company?.name) companySet.add(s.company.name.toLowerCase());
    });
    referrals.forEach((r) => {
      if (r.company) companySet.add(r.company.toLowerCase());
    });

    const recentImpact = [
      ...referrals.slice(0, 5).map((r) => ({
        type: 'referral',
        title: `${r.company} - ${r.role}`,
        meta: `${r.clicks || 0} clicks, ${(r.applyIntentCount || 0) + (r.saveCount || 0)} intents`,
        createdAt: r.createdAt,
      })),
      ...experiences.map((e) => ({
        type: 'experience',
        title: `${e.company?.name || 'Company'} - ${e.role}`,
        meta: `${e.upvoteCount || 0} upvotes`,
        createdAt: e.createdAt,
      })),
      ...salaries.map((s) => ({
        type: 'salary',
        title: `${s.company?.name || 'Company'} - ${s.role}`,
        meta: `CTC ${s.ctc} LPA`,
        createdAt: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    const now = new Date();
    const expiryCutoff = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const upcomingExpiries = referrals
      .filter((r) => r.status === 'active' && r.expiresAt && new Date(r.expiresAt) >= now && new Date(r.expiresAt) <= expiryCutoff)
      .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))
      .slice(0, 5)
      .map((r) => ({
        _id: r._id,
        role: r.role,
        company: r.company,
        expiresAt: r.expiresAt,
      }));

    return {
      experiencesShared: experienceCount,
      referralsPosted: referralCount,
      salaryContributions: salaryCount,
      referralClicks: totalClicks,
      studentsHelped: totalClicks + totalIntent,
      studentsHelpedThisMonth: uniqueStudentsMonth.size,
      companiesContributedTo: companySet.size,
      recentImpact,
      upcomingReferralExpiries: upcomingExpiries,
    };
  });

  return apiResponse.success(res, data);
});

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
const exportData = asyncHandler(async (req, res) => {
  const applications = await Application.find({ isWithdrawn: false, status: 'offer' })
    .populate('student', 'name email branch batch college')
    .populate('company', 'name sector ctc')
    .lean();

  const rows = [
    ['Name', 'Email', 'Branch', 'Batch', 'College', 'Company', 'Sector', 'CTC Max', 'Status', 'Applied On'],
    ...applications.map((a) => [
      a.student?.name        || '',
      a.student?.email       || '',
      a.student?.branch      || '',
      a.student?.batch       || '',
      a.student?.college     || '',
      a.company?.name        || '',
      a.company?.sector      || '',
      a.company?.ctc?.max    || '',
      a.status,
      new Date(a.createdAt).toLocaleDateString('en-IN'),
    ]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="placements-${Date.now()}.csv"`);
  res.send(csv);
});

// ─── INVALIDATE CACHE (utility) ───────────────────────────────────────────────
const invalidateDashboardCache = async () => {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys('dashboard:*');
    if (keys.length) await redis.del(...keys);
  } catch {}
};

module.exports = {
  getPlacementStats, getCompanyFunnel, getBatchStats,
  getTimelineData, getRecentActivity, exportData,
  getAlumniImpact,
  getCoordinatorOperations,
  invalidateDashboardCache,
};
