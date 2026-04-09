const asyncHandler  = require('../utils/asyncHandler');
const apiResponse   = require('../utils/apiResponse');
const { searchExperiences, searchCompanies, getSuggestions } = require('../services/search.service');

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
const globalSearch = asyncHandler(async (req, res) => {
  const { q, type, verdict, difficulty, year, companyId, sort = 'relevance', page = 1, limit = 10 } = req.query;

  if (!q?.trim()) {
    return apiResponse.success(res, { experiences: [], companies: [], total: 0 });
  }

  const filters = { verdict, difficulty, year, companyId };

  const [experiences, companies] = await Promise.all([
    (!type || type === 'experience')
      ? searchExperiences(q, filters, Number(limit))
      : Promise.resolve([]),
    (!type || type === 'company')
      ? searchCompanies(q, 6)
      : Promise.resolve([]),
  ]);

  // Sort experiences
  let sorted = [...experiences];
  if (sort === 'date')     sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === 'upvotes')  sorted.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));

  // Mask anonymous authors
  const maskedExp = sorted.map((e) => ({
    ...e,
    author: e.isAnonymous ? null : e.author,
    upvotes: undefined,
  }));

  return apiResponse.success(res, {
    experiences: maskedExp,
    companies,
    total: maskedExp.length + companies.length,
    query: q,
  });
});

// ─── AUTOCOMPLETE SUGGESTIONS ─────────────────────────────────────────────────
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const suggestions = await getSuggestions(q);
  return apiResponse.success(res, suggestions);
});

module.exports = { globalSearch, getSearchSuggestions };
