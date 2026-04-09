const asyncHandler = require('../utils/asyncHandler');
const apiResponse  = require('../utils/apiResponse');
const { generateInterviewPrep } = require('../services/ai.service');
const { getRedis } = require('../config/redis');
const AIHistory = require('../models/AIHistory.model');
const Company = require('../models/Company.model');

const DAILY_LIMIT = 5;

// ─── Check + increment rate limit ─────────────────────────────────────────────
const getRateLimit = async (userId) => {
  const redis = getRedis();
  if (!redis) return { used: 0, remaining: DAILY_LIMIT }; // No Redis = no rate limiting

  const key = `ai:ratelimit:${userId}:${new Date().toISOString().split('T')[0]}`;
  try {
    const used = parseInt(await redis.get(key) || '0', 10);
    return { used, remaining: DAILY_LIMIT - used, key };
  } catch {
    return { used: 0, remaining: DAILY_LIMIT };
  }
};

const incrementRateLimit = async (key) => {
  const redis = getRedis();
  if (!redis || !key) return;
  try {
    const val = await redis.incr(key);
    if (val === 1) {
      // Set TTL to end of day
      const now      = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const ttl = Math.floor((midnight - now) / 1000);
      await redis.expire(key, ttl);
    }
  } catch {}
};

// ─── SSE: Generate Interview Prep ─────────────────────────────────────────────
const generatePrep = asyncHandler(async (req, res) => {
  const { companyId, role } = req.body;

  if (!companyId) {
    return apiResponse.error(res, 'companyId is required', 400);
  }

  // Check rate limit
  const { used, remaining, key } = await getRateLimit(req.user.id);
  if (remaining <= 0) {
    return apiResponse.error(res, `Daily limit reached (${DAILY_LIMIT} requests/day). Try again tomorrow.`, 429);
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial meta
  send('meta', { used: used + 1, remaining: remaining - 1, limit: DAILY_LIMIT });

  let finished = false;

  await generateInterviewPrep(
    companyId,
    role,
    // onChunk
    (text) => {
      if (!finished) send('chunk', { text });
    },
    // onDone
    ({ companyName, experienceCount }) => {
      finished = true;
      incrementRateLimit(key);
      send('done', { companyName, experienceCount });
      res.end();
    },
    // onError
    (err) => {
      finished = true;
      send('error', { message: err.message || 'AI generation failed' });
      res.end();
    }
  );
});

// ─── Get rate limit status ────────────────────────────────────────────────────
const getRateLimitStatus = asyncHandler(async (req, res) => {
  const { used, remaining } = await getRateLimit(req.user.id);
  return apiResponse.success(res, { used, remaining, limit: DAILY_LIMIT });
});

// ─── Get AI prep history ──────────────────────────────────────────────────────
const getAIHistory = asyncHandler(async (req, res) => {
  const { type, company, limit = 20, page = 1 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { student: req.user.id };
  if (type) filter.type = type;
  if (company) filter.company = company;

  const [history, total] = await Promise.all([
    AIHistory.find(filter)
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AIHistory.countDocuments(filter),
  ]);

  return apiResponse.success(res, {
    history,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── Track AI prep generation (called after streaming completes) ───────────────
const trackPrepGeneration = asyncHandler(async (req, res) => {
  const { companyId, role, prepContent, experienceCount } = req.body;

  if (!companyId || !role) {
    return apiResponse.error(res, 'companyId and role are required', 400);
  }

  const company = await Company.findById(companyId);
  if (!company) return apiResponse.error(res, 'Company not found', 404);

  // Extract key takeaways from prep content (first few sentences from each section)
  const takeaways = extractTakeaways(prepContent);

  const history = await AIHistory.create({
    student: req.user.id,
    company: companyId,
    role,
    type: 'interview_prep',
    prepContent: prepContent.slice(0, 5000), // Store first 5k chars
    keyTakeaways: takeaways,
    experienceCount: experienceCount || 0,
  });

  return apiResponse.success(res, { history }, 'Prep tracked', 201);
});

// ─── Track mock interview ──────────────────────────────────────────────────────
const trackMockInterview = asyncHandler(async (req, res) => {
  const { companyId, role, performanceScore, questionsAsked, duration, notes } = req.body;

  if (!companyId || !role || performanceScore === undefined) {
    return apiResponse.error(res, 'companyId, role, and performanceScore are required', 400);
  }

  const company = await Company.findById(companyId);
  if (!company) return apiResponse.error(res, 'Company not found', 404);

  const history = await AIHistory.create({
    student: req.user.id,
    company: companyId,
    role,
    type: 'mock_interview',
    performanceScore,
    questionsAsked: questionsAsked || [],
    duration: duration || null,
    notes: notes || '',
  });

  return apiResponse.success(res, { history }, 'Mock interview tracked', 201);
});

// ─── Mark prep as helpful ─────────────────────────────────────────────────────
const markPrepFeedback = asyncHandler(async (req, res) => {
  const { historyId } = req.params;
  const { isHelpful } = req.body;

  const history = await AIHistory.findById(historyId);
  if (!history) return apiResponse.error(res, 'History not found', 404);

  if (history.student.toString() !== req.user.id) {
    return apiResponse.error(res, 'Forbidden', 403);
  }

  history.isHelpful = isHelpful;
  await history.save();

  return apiResponse.success(res, { history });
});

// ─── Extract key takeaways from prep content ──────────────────────────────────
const extractTakeaways = (content) => {
  if (!content) return [];
  const lines = content.split('\n');
  const takeaways = [];
  
  // Extract first 3 numbered items or bullet points
  for (const line of lines) {
    const match = line.match(/^\s*[-•]\s+(.{10,100})/); // Match bullet/dash lines
    if (match && takeaways.length < 5) {
      takeaways.push(match[1].trim());
    }
  }
  
  return takeaways;
};

module.exports = {
  generatePrep,
  getRateLimitStatus,
  getAIHistory,
  trackPrepGeneration,
  trackMockInterview,
  markPrepFeedback,
};
