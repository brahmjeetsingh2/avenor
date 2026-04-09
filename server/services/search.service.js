// const mongoose   = require('mongoose');
// const Experience = require('../models/Experience.model');
// const Company    = require('../models/Company.model');

// // ─── Atlas Search pipeline (requires Atlas M0+ with search index) ─────────────
// // If Atlas Search index doesn't exist, falls back to regex automatically.

// const ATLAS_SEARCH_ENABLED = process.env.ATLAS_SEARCH_ENABLED === 'true';

// // ─── Full-text experience search ──────────────────────────────────────────────
// const searchExperiences = async (query, filters = {}, limit = 10) => {
//   if (!query?.trim()) return [];

//   const { verdict, difficulty, year, companyId } = filters;

//   try {
//     if (ATLAS_SEARCH_ENABLED) {
//       const pipeline = [
//         {
//           $search: {
//             index: 'experiences_search',
//             compound: {
//               should: [
//                 { text: { query, path: 'role',              fuzzy: { maxEdits: 1 }, score: { boost: { value: 4 } } } },
//                 { text: { query, path: 'tips',              fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
//                 { text: { query, path: 'rounds.questions',  fuzzy: { maxEdits: 1 }, score: { boost: { value: 3 } } } },
//                 { text: { query, path: 'rounds.experience', fuzzy: { maxEdits: 1 }, score: { boost: { value: 1 } } } },
//                 { text: { query, path: 'tags',              fuzzy: { maxEdits: 0 }, score: { boost: { value: 2 } } } },
//               ],
//               filter: [{ equals: { path: 'isDeleted', value: false } }],
//             },
//             highlight: { path: ['role', 'tips', 'rounds.questions'] },
//           },
//         },
//         {
//           $project: {
//             _id: 1, role: 1, verdict: 1, difficulty: 1, year: 1,
//             isAnonymous: 1, upvoteCount: 1, createdAt: 1, tags: 1,
//             company: 1, author: 1,
//             score:      { $meta: 'searchScore' },
//             highlights: { $meta: 'searchHighlights' },
//           },
//         },
//         { $sort: { score: -1 } },
//         { $limit: limit },
//         { $lookup: { from: 'companies', localField: 'company', foreignField: '_id', as: 'company' } },
//         { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
//         { $lookup: { from: 'users',    localField: 'author',  foreignField: '_id', as: 'author'  } },
//         { $unwind: { path: '$author',  preserveNullAndEmptyArrays: true } },
//       ];

//       if (verdict)    pipeline.splice(1, 0, { $match: { verdict } });
//       if (difficulty) pipeline.splice(1, 0, { $match: { difficulty: Number(difficulty) } });
//       if (year)       pipeline.splice(1, 0, { $match: { year: Number(year) } });
//       if (companyId)  pipeline.splice(1, 0, { $match: { company: new mongoose.Types.ObjectId(companyId) } });

//       return await Experience.aggregate(pipeline);
//     }
//   } catch (err) {
//     console.warn('⚠️  Atlas Search failed, falling back to regex:', err.message);
//   }

//   // ── Regex fallback ────────────────────────────────────────────────────────
//   const filter = {
//     isDeleted: false,
//     $or: [
//       { role:               { $regex: query, $options: 'i' } },
//       { tips:               { $regex: query, $options: 'i' } },
//       { tags:               { $regex: query, $options: 'i' } },
//       { 'rounds.questions': { $regex: query, $options: 'i' } },
//       { 'rounds.experience':{ $regex: query, $options: 'i' } },
//     ],
//   };
//   if (verdict)   filter.verdict    = verdict;
//   if (difficulty) filter.difficulty = Number(difficulty);
//   if (year)      filter.year       = Number(year);
//   if (companyId) filter.company    = new mongoose.Types.ObjectId(companyId);

//   const results = await Experience.find(filter)
//     .populate('company', 'name logo sector')
//     .populate('author', 'name branch batch')
//     .sort({ upvoteCount: -1, createdAt: -1 })
//     .limit(limit)
//     .lean();

//   // Attach a simple text highlight snippet
//   return results.map((exp) => ({
//     ...exp,
//     score: 1,
//     highlights: buildHighlight(exp, query),
//   }));
// };

// // ─── Company search ───────────────────────────────────────────────────────────
// const searchCompanies = async (query, limit = 6) => {
//   if (!query?.trim()) return [];

//   try {
//     if (ATLAS_SEARCH_ENABLED) {
//       return await Company.aggregate([
//         {
//           $search: {
//             index: 'companies_search',
//             compound: {
//               should: [
//                 { text: { query, path: 'name',        fuzzy: { maxEdits: 1 }, score: { boost: { value: 5 } } } },
//                 { text: { query, path: 'sector',      fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
//                 { text: { query, path: 'description', fuzzy: { maxEdits: 1 } } },
//               ],
//               filter: [{ equals: { path: 'isActive', value: true } }],
//             },
//             highlight: { path: ['name', 'sector'] },
//           },
//         },
//         {
//           $project: {
//             name: 1, logo: 1, sector: 1, type: 1, currentStage: 1,
//             ctc: 1, applicationDeadline: 1,
//             score:      { $meta: 'searchScore' },
//             highlights: { $meta: 'searchHighlights' },
//           },
//         },
//         { $sort: { score: -1 } },
//         { $limit: limit },
//       ]);
//     }
//   } catch {}

//   // Regex fallback
//   return Company.find({
//     isActive: true,
//     $or: [
//       { name:        { $regex: query, $options: 'i' } },
//       { sector:      { $regex: query, $options: 'i' } },
//       { description: { $regex: query, $options: 'i' } },
//     ],
//   })
//     .select('name logo sector type currentStage ctc applicationDeadline')
//     .limit(limit)
//     .lean();
// };

// // ─── Autocomplete suggestions ─────────────────────────────────────────────────
// const getSuggestions = async (query) => {
//   if (!query?.trim() || query.length < 2) return { companies: [], roles: [] };

//   const [companies, roles] = await Promise.all([
//     Company.find({ isActive: true, name: { $regex: `^${query}`, $options: 'i' } })
//       .select('name logo sector')
//       .limit(4)
//       .lean(),

//     Experience.distinct('role', {
//       isDeleted: false,
//       role: { $regex: query, $options: 'i' },
//     }).then((r) => r.slice(0, 5)),
//   ]);

//   return { companies, roles };
// };

// // ─── Simple highlight builder for regex fallback ──────────────────────────────
// const buildHighlight = (exp, query) => {
//   const re      = new RegExp(`(${query})`, 'gi');
//   const snippet = (text) => {
//     if (!text) return null;
//     const idx = text.toLowerCase().indexOf(query.toLowerCase());
//     if (idx === -1) return null;
//     const start = Math.max(0, idx - 40);
//     const end   = Math.min(text.length, idx + query.length + 60);
//     return text.slice(start, end).replace(re, '**$1**');
//   };

//   const snips = [
//     snippet(exp.role),
//     snippet(exp.tips),
//   ].filter(Boolean);

//   return snips.length ? [{ path: 'snippet', texts: [{ value: snips[0], type: 'hit' }] }] : [];
// };

// // ─── Atlas Search index configs (for reference / Atlas UI setup) ──────────────
// const ATLAS_INDEX_CONFIGS = {
//   experiences: {
//     name: 'experiences_search',
//     definition: {
//       mappings: {
//         dynamic: false,
//         fields: {
//           role:               [{ type: 'string', analyzer: 'lucene.standard' }, { type: 'autocomplete' }],
//           tips:               [{ type: 'string', analyzer: 'lucene.standard' }],
//           tags:               [{ type: 'string', analyzer: 'lucene.standard' }],
//           isDeleted:          [{ type: 'boolean' }],
//           'rounds.questions': [{ type: 'string', analyzer: 'lucene.standard' }],
//           'rounds.experience':[{ type: 'string', analyzer: 'lucene.standard' }],
//         },
//       },
//     },
//   },
//   companies: {
//     name: 'companies_search',
//     definition: {
//       mappings: {
//         dynamic: false,
//         fields: {
//           name:        [{ type: 'string', analyzer: 'lucene.standard' }, { type: 'autocomplete' }],
//           sector:      [{ type: 'string', analyzer: 'lucene.standard' }],
//           description: [{ type: 'string', analyzer: 'lucene.standard' }],
//           isActive:    [{ type: 'boolean' }],
//         },
//       },
//     },
//   },
// };

// module.exports = { searchExperiences, searchCompanies, getSuggestions, ATLAS_INDEX_CONFIGS };
















const mongoose   = require('mongoose');
const Experience = require('../models/Experience.model');
const Company    = require('../models/Company.model');

// ─── Atlas Search pipeline (requires Atlas M0+ with search index) ─────────────
// If Atlas Search index doesn't exist, falls back to regex automatically.

const ATLAS_SEARCH_ENABLED = process.env.ATLAS_SEARCH_ENABLED === 'true';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EXPERIENCE_TEXT_PATHS = ['role', 'tips', 'rounds.questions', 'rounds.experience', 'tags'];

const getMatchedCompanyIds = async (query) => {
  if (!query?.trim()) return [];

  const raw = query.trim();
  const tokens = raw.split(/\s+/).filter(Boolean).map(escapeRegex);
  const flexibleNamePattern = tokens.length
    ? tokens.join('[^a-zA-Z0-9]*')
    : escapeRegex(raw);

  const companies = await Company.find({
    name: { $regex: flexibleNamePattern, $options: 'i' },
  })
    .select('_id')
    .limit(20)
    .lean();

  return companies.map((company) => company._id);
};

const buildExperienceBaseMatch = ({ verdict, difficulty, year }) => {
  const match = { isDeleted: false };

  if (verdict) match.verdict = verdict;
  if (difficulty) match.difficulty = Number(difficulty);
  if (year) match.year = Number(year);

  return match;
};

const dedupeExperiences = (experiences = []) => {
  const seen = new Set();

  return experiences.filter((experience) => {
    const id = String(experience._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// ─── Full-text experience search ──────────────────────────────────────────────
const searchExperiences = async (query, filters = {}, limit = 10) => {
  if (!query?.trim()) return [];

  const { verdict, difficulty, year, companyId } = filters;
  const matchedCompanyIds = companyId ? [] : await getMatchedCompanyIds(query);
  const effectiveCompanyFilter = companyId
    ? [new mongoose.Types.ObjectId(companyId)]
    : matchedCompanyIds;
  const baseMatch = buildExperienceBaseMatch({ verdict, difficulty, year });

  try {
    if (ATLAS_SEARCH_ENABLED) {
      const textResultsPromise = Experience.aggregate([
        {
          $search: {
            index: 'experiences_search',
            compound: {
              minimumShouldMatch: 1,
              should: [
                { text: { query, path: 'role',              fuzzy: { maxEdits: 1 }, score: { boost: { value: 4 } } } },
                { text: { query, path: 'tips',              fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
                { text: { query, path: 'rounds.questions',  fuzzy: { maxEdits: 1 }, score: { boost: { value: 3 } } } },
                { text: { query, path: 'rounds.experience', fuzzy: { maxEdits: 1 }, score: { boost: { value: 1 } } } },
                { text: { query, path: 'tags',              fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
              ],
              filter: [{ equals: { path: 'isDeleted', value: false } }],
            },
            highlight: { path: ['role', 'tips', 'rounds.questions'] },
          },
        },
        { $match: baseMatch },
        {
          $project: {
            _id: 1, role: 1, verdict: 1, difficulty: 1, year: 1,
            isAnonymous: 1, upvoteCount: 1, createdAt: 1, tags: 1,
            company: 1, author: 1, rounds: 1, tips: 1,
            score:      { $meta: 'searchScore' },
            highlights: { $meta: 'searchHighlights' },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limit },
        { $lookup: { from: 'companies', localField: 'company', foreignField: '_id', as: 'company' } },
        { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'users',    localField: 'author',  foreignField: '_id', as: 'author'  } },
        { $unwind: { path: '$author',  preserveNullAndEmptyArrays: true } },
      ]);

      const companyResultsPromise = effectiveCompanyFilter.length
        ? Experience.find({
          ...baseMatch,
          company: { $in: effectiveCompanyFilter },
        })
          .populate('company', 'name logo sector')
          .populate('author', 'name branch batch')
          .sort({ upvoteCount: -1, createdAt: -1 })
          .limit(limit)
          .lean()
          .then((results) => results.map((exp) => ({
            ...exp,
            score: exp.company?.name?.toLowerCase() === query.trim().toLowerCase() ? 3 : 2,
            highlights: buildHighlight(exp, query),
          })))
        : Promise.resolve([]);

      const [textResults, companyResults] = await Promise.all([
        textResultsPromise,
        companyResultsPromise,
      ]);

      return dedupeExperiences([...textResults, ...companyResults])
        .sort((a, b) => {
          const scoreDiff = (b.score || 0) - (a.score || 0);
          if (scoreDiff !== 0) return scoreDiff;

          const upvoteDiff = (b.upvoteCount || 0) - (a.upvoteCount || 0);
          if (upvoteDiff !== 0) return upvoteDiff;

          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .slice(0, limit);
    }
  } catch (err) {
    console.warn('⚠️  Atlas Search failed, falling back to regex:', err.message);
  }

  // ── Regex fallback ────────────────────────────────────────────────────────
  const filter = {
    ...baseMatch,
    $or: EXPERIENCE_TEXT_PATHS.map((path) => ({ [path]: { $regex: query, $options: 'i' } })),
  };
  if (effectiveCompanyFilter.length) {
    filter.$or.push({ company: { $in: effectiveCompanyFilter } });
  }

  const results = await Experience.find(filter)
    .populate('company', 'name logo sector')
    .populate('author', 'name branch batch')
    .sort({ upvoteCount: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  // Attach a simple text highlight snippet
  return results.map((exp) => ({
    ...exp,
    score: 1,
    highlights: buildHighlight(exp, query),
  }));
};

// ─── Company search ───────────────────────────────────────────────────────────
const searchCompanies = async (query, limit = 6) => {
  if (!query?.trim()) return [];

  try {
    if (ATLAS_SEARCH_ENABLED) {
      return await Company.aggregate([
        {
          $search: {
            index: 'companies_search',
            compound: {
              minimumShouldMatch: 1,
              should: [
                { text: { query, path: 'name',        fuzzy: { maxEdits: 1 }, score: { boost: { value: 5 } } } },
                { text: { query, path: 'sector',      fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
                { text: { query, path: 'description', fuzzy: { maxEdits: 1 } } },
              ],
              filter: [{ equals: { path: 'isActive', value: true } }],
            },
            highlight: { path: ['name', 'sector'] },
          },
        },
        {
          $project: {
            name: 1, logo: 1, sector: 1, type: 1, currentStage: 1,
            ctc: 1, applicationDeadline: 1,
            score:      { $meta: 'searchScore' },
            highlights: { $meta: 'searchHighlights' },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limit },
      ]);
    }
  } catch {}

  // Regex fallback
  return Company.find({
    isActive: true,
    $or: [
      { name:        { $regex: query, $options: 'i' } },
      { sector:      { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  })
    .select('name logo sector type currentStage ctc applicationDeadline')
    .limit(limit)
    .lean();
};

// ─── Autocomplete suggestions ─────────────────────────────────────────────────
const getSuggestions = async (query) => {
  if (!query?.trim() || query.length < 2) return { companies: [], roles: [] };

  const [companies, roles] = await Promise.all([
    Company.find({ isActive: true, name: { $regex: `^${query}`, $options: 'i' } })
      .select('name logo sector')
      .limit(4)
      .lean(),

    Experience.distinct('role', {
      isDeleted: false,
      role: { $regex: query, $options: 'i' },
    }).then((r) => r.slice(0, 5)),
  ]);

  return { companies, roles };
};

// ─── Simple highlight builder for regex fallback ──────────────────────────────
const buildHighlight = (exp, query) => {
  const re      = new RegExp(`(${query})`, 'gi');
  const snippet = (text) => {
    if (!text) return null;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return null;
    const start = Math.max(0, idx - 40);
    const end   = Math.min(text.length, idx + query.length + 60);
    return text.slice(start, end).replace(re, '**$1**');
  };

  const snips = [
    snippet(exp.company?.name),
    snippet(exp.role),
    snippet(exp.tips),
    ...(exp.rounds || []).flatMap((round) => [
      snippet(round.experience),
      ...(round.questions || []).map(snippet),
    ]),
  ].filter(Boolean);

  return snips.length ? [{ path: 'snippet', texts: [{ value: snips[0], type: 'hit' }] }] : [];
};

// ─── Atlas Search index configs (for reference / Atlas UI setup) ──────────────
const ATLAS_INDEX_CONFIGS = {
  experiences: {
    name: 'experiences_search',
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          role:               [{ type: 'string', analyzer: 'lucene.standard' }, { type: 'autocomplete' }],
          tips:               [{ type: 'string', analyzer: 'lucene.standard' }],
          tags:               [{ type: 'string', analyzer: 'lucene.standard' }],
          isDeleted:          [{ type: 'boolean' }],
          'rounds.questions': [{ type: 'string', analyzer: 'lucene.standard' }],
          'rounds.experience':[{ type: 'string', analyzer: 'lucene.standard' }],
        },
      },
    },
  },
  companies: {
    name: 'companies_search',
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          name:        [{ type: 'string', analyzer: 'lucene.standard' }, { type: 'autocomplete' }],
          sector:      [{ type: 'string', analyzer: 'lucene.standard' }],
          description: [{ type: 'string', analyzer: 'lucene.standard' }],
          isActive:    [{ type: 'boolean' }],
        },
      },
    },
  },
};

module.exports = { searchExperiences, searchCompanies, getSuggestions, ATLAS_INDEX_CONFIGS };
