const mongoose = require('mongoose');
const Experience = require('../models/Experience.model');
const Company = require('../models/Company.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse  = require('../utils/apiResponse');
const { getRedis } = require('../config/redis');

const FEED_TTL = 300; // 5 minutes

// ─── Recency score helper (0–1, decays over 30 days) ─────────────────────────
const recencyScore = (createdAt) => {
  const ageMs   = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - ageDays / 30);
};

// ─── Rank experiences ─────────────────────────────────────────────────────────
const rankExperiences = (experiences, userProfile = {}) => {
  return experiences
    .map((exp) => {
      const upvoteS  = Math.min(exp.upvoteCount / 20, 1) * 0.4;
      const recentS  = recencyScore(exp.createdAt) * 0.3;
      const companyS = userProfile.companyId && exp.company?._id?.toString() === userProfile.companyId ? 0.2 : 0;
      const roleS    = userProfile.role && exp.role?.toLowerCase().includes(userProfile.role.toLowerCase()) ? 0.1 : 0;
      return { ...exp, _score: upvoteS + recentS + companyS + roleS };
    })
    .sort((a, b) => b._score - a._score);
};

// ─── CREATE EXPERIENCE ────────────────────────────────────────────────────────
const createExperience = asyncHandler(async (req, res) => {
  const { company, role, year, batch, rounds, verdict, difficulty, tips, isAnonymous, tags } = req.body;

  if (!company || !role || !verdict || !difficulty) {
    return apiResponse.error(res, 'company, role, verdict and difficulty are required', 400);
  }

  const experience = await Experience.create({
    author: req.user.id,
    company, role, year: year || new Date().getFullYear(),
    batch, rounds: rounds || [], verdict, difficulty,
    tips: tips || '', isAnonymous: !!isAnonymous,
    tags: tags || [],
  });

  await experience.populate('company', 'name logo sector');

  // Invalidate feed cache
  const redis = getRedis();
  if (redis) {
    const keys = await redis.keys('feed:*');
    if (keys.length) await redis.del(...keys);
  }

  return apiResponse.success(res, { experience }, 'Experience posted', 201);
});

// ─── GET FEED ─────────────────────────────────────────────────────────────────
const getExperiences = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10,
    company, verdict, difficulty,
    year, roundType, search,
  } = req.query;

  const userId   = req.user?.id;
  const cacheKey = `feed:${userId}:p${page}:${company||''}:${verdict||''}:${difficulty||''}:${year||''}:${roundType||''}`;

  // Try cache (only page 1 with no filters)
  const redis = getRedis();
  if (redis && page == 1 && !company && !verdict && !difficulty && !year && !roundType && !search) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch {}
  }

  const filter = { isDeleted: false };
  if (company) {
    if (mongoose.Types.ObjectId.isValid(company)) {
      filter.company = company;
    } else {
      const matchedCompanies = await Company.find({
        name: { $regex: company, $options: 'i' },
      }).select('_id').limit(25).lean();
      filter.company = { $in: matchedCompanies.map((c) => c._id) };
    }
  }
  if (verdict)    filter.verdict    = verdict;
  if (difficulty) filter.difficulty = Number(difficulty);
  if (year)       filter.year       = Number(year);
  if (roundType)  filter['rounds.type'] = roundType;
  if (search) {
    const matchedCompanies = await Company.find({
      name: { $regex: search, $options: 'i' },
    }).select('_id').limit(25).lean();
    const companyIds = matchedCompanies.map((c) => c._id);

    filter.$or = [
      { role:  { $regex: search, $options: 'i' } },
      { tips:  { $regex: search, $options: 'i' } },
      { tags:  { $regex: search, $options: 'i' } },
      { 'rounds.questions': { $regex: search, $options: 'i' } },
      { 'rounds.experience':{ $regex: search, $options: 'i' } },
      ...(companyIds.length ? [{ company: { $in: companyIds } }] : []),
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [raw, total] = await Promise.all([
    Experience.find(filter)
      .populate('company', 'name logo sector')
      .populate('author', 'name branch batch profilePic')
      .sort({ upvoteCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit) * 2) // over-fetch for ranking
      .lean(),
    Experience.countDocuments(filter),
  ]);

  // Mask anonymous authors
  const masked = raw.map((e) => ({
    ...e,
    author: e.isAnonymous ? null : e.author,
    hasUpvoted: userId ? e.upvotes?.some((id) => id.toString() === userId) : false,
    upvotes: undefined, // don't send full array
  }));

  // Rank and slice
  const ranked = rankExperiences(masked).slice(0, Number(limit));

  const response = {
    success: true,
    data: { experiences: ranked },
    pagination: {
      page: Number(page), limit: Number(limit),
      total, pages: Math.ceil(total / Number(limit)),
    },
  };

  // Cache page 1 with no filters
  if (redis && page == 1 && !company && !verdict && !difficulty && !year && !roundType && !search) {
    try { await redis.setex(cacheKey, FEED_TTL, JSON.stringify(response)); } catch {}
  }

  return res.json(response);
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getExperienceById = asyncHandler(async (req, res) => {
  const experience = await Experience.findOne({ _id: req.params.id, isDeleted: false })
    .populate('company', 'name logo sector type')
    .populate('author', 'name branch batch profilePic college');

  if (!experience) return apiResponse.error(res, 'Experience not found', 404);

  const userId = req.user?.id;
  const result = experience.toObject();
  result.hasUpvoted = userId ? experience.upvotes.some((id) => id.toString() === userId) : false;
  if (result.isAnonymous) result.author = null;
  delete result.upvotes;

  return apiResponse.success(res, { experience: result });
});

// ─── UPVOTE ───────────────────────────────────────────────────────────────────
const upvoteExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.findOne({ _id: req.params.id, isDeleted: false });
  if (!experience) return apiResponse.error(res, 'Experience not found', 404);

  const userId  = req.user.id;
  const idx     = experience.upvotes.findIndex((id) => id.toString() === userId);
  const action  = idx === -1 ? 'upvoted' : 'removed';

  if (idx === -1) experience.upvotes.push(userId);
  else            experience.upvotes.splice(idx, 1);

  await experience.save();

  return apiResponse.success(res, { upvoteCount: experience.upvoteCount, action });
});

// ─── GET BY COMPANY ───────────────────────────────────────────────────────────
const getExperiencesByCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { limit = 20, verdict } = req.query;

  const filter = { company: companyId, isDeleted: false };
  if (verdict) filter.verdict = verdict;

  const experiences = await Experience.find(filter)
    .populate('author', 'name branch batch profilePic')
    .sort({ upvoteCount: -1, createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const userId = req.user?.id;
  const masked = experiences.map((e) => ({
    ...e,
    author: e.isAnonymous ? null : e.author,
    hasUpvoted: userId ? e.upvotes?.some((id) => id.toString() === userId) : false,
    upvotes: undefined,
  }));

  return apiResponse.success(res, { experiences: masked });
});

// ─── SEARCH (regex fallback — Atlas Search added when Atlas tier supports it) ─
const searchExperiences = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q?.trim()) return apiResponse.success(res, { experiences: [] });

  const matchedCompanies = await Company.find({
    name: { $regex: q, $options: 'i' },
  }).select('_id').limit(25).lean();
  const companyIds = matchedCompanies.map((c) => c._id);

  const experiences = await Experience.find({
    isDeleted: false,
    $or: [
      { role:  { $regex: q, $options: 'i' } },
      { tips:  { $regex: q, $options: 'i' } },
      { tags:  { $regex: q, $options: 'i' } },
      { 'rounds.questions':  { $regex: q, $options: 'i' } },
      { 'rounds.experience': { $regex: q, $options: 'i' } },
      ...(companyIds.length ? [{ company: { $in: companyIds } }] : []),
    ],
  })
    .populate('company', 'name logo')
    .populate('author', 'name')
    .limit(Number(limit))
    .lean();

  const masked = experiences.map((e) => ({
    ...e,
    author: e.isAnonymous ? null : e.author,
    upvotes: undefined,
  }));

  return apiResponse.success(res, { experiences: masked });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.findById(req.params.id);
  if (!experience) return apiResponse.error(res, 'Experience not found', 404);

  const isOwner = experience.author.toString() === req.user.id;
  const isCoord = req.user.role === 'coordinator';
  if (!isOwner && !isCoord) return apiResponse.error(res, 'Forbidden', 403);

  experience.isDeleted = true;
  await experience.save();

  return apiResponse.success(res, {}, 'Experience deleted');
});

// ─── GET STATS ────────────────────────────────────────────────────────────────
const getExperienceStats = asyncHandler(async (req, res) => {
  const { companyId } = req.query;
  const match = { isDeleted: false };
  if (companyId) match.company = new mongoose.Types.ObjectId(companyId);

  const [verdictStats, diffStats, roundStats] = await Promise.all([
    Experience.aggregate([{ $match: match }, { $group: { _id: '$verdict', count: { $sum: 1 } } }]),
    Experience.aggregate([{ $match: match }, { $group: { _id: null, avgDiff: { $avg: '$difficulty' } } }]),
    Experience.aggregate([
      { $match: match },
      { $unwind: '$rounds' },
      { $group: { _id: '$rounds.type', count: { $sum: 1 } } },
    ]),
  ]);

  return apiResponse.success(res, { verdictStats, avgDifficulty: diffStats[0]?.avgDiff || 0, roundStats });
});

module.exports = {
  createExperience,
  getExperiences,
  getExperienceById,
  upvoteExperience,
  getExperiencesByCompany,
  searchExperiences,
  deleteExperience,
  getExperienceStats,
};
