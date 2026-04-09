import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExperienceCard from '../shared/ExperienceCard';
import experienceService from '../../services/experienceService';

const StudentExperiencesPage = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCompany, setSelectedCompany] = useState(searchParams.get('company') || '');
  const [selectedVerdict, setSelectedVerdict] = useState(searchParams.get('verdict') || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get('difficulty') || '');
  const [roundType, setRoundType] = useState(searchParams.get('round') || '');

  const limit = 12;

  // Fetch experiences
  const fetchExperiences = async (pageNum) => {
    setLoading(true);
    try {
      const response = await experienceService.getFeed({
        page: pageNum,
        limit,
        company: selectedCompany,
        verdict: selectedVerdict,
        difficulty: selectedDifficulty,
        roundType,
        search,
      });

      const data = response?.data || {};
      setExperiences(data.experiences || []);
      setTotal(response?.pagination?.total || 0);
      setPage(pageNum);

      // Update URL params
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCompany) params.set('company', selectedCompany);
      if (selectedVerdict) params.set('verdict', selectedVerdict);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (roundType) params.set('round', roundType);
      setSearchParams(params);
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    setPage(1);
    fetchExperiences(1);
  }, [selectedCompany, selectedVerdict, selectedDifficulty, roundType, search]);

  // Handle upvote toggle
  const handleUpvoteToggle = (expId) => {
    setExperiences(prev =>
      prev.map(exp => {
        if (exp._id === expId) {
          const newUpvotes = exp.hasUpvoted
            ? exp.upvoteCount - 1
            : exp.upvoteCount + 1;
          return { ...exp, upvoteCount: newUpvotes, hasUpvoted: !exp.hasUpvoted };
        }
        return exp;
      })
    );
  };

  const handleFilterReset = () => {
    setSearch('');
    setSelectedCompany('');
    setSelectedVerdict('');
    setSelectedDifficulty('');
    setRoundType('');
    setSearchParams({});
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--bg),var(--surface-2))] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            Interview Experiences
          </h1>
          <p className="text-[var(--text-secondary)]">
            Learn from {total} real experiences shared by seniors
          </p>
        </div>

        {/* Search & Filters Section */}
        <div className="card p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by role, company, tips, or questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Company
              </label>
              <input
                type="text"
                placeholder="e.g., Google"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
              />
            </div>

            {/* Verdict Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Verdict
              </label>
              <select
                value={selectedVerdict}
                onChange={(e) => setSelectedVerdict(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
              >
                <option value="">All Outcomes</option>
                <option value="selected">✓ Selected</option>
                <option value="rejected">✗ Rejected</option>
                <option value="waitlisted">⏳ Waitlisted</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
              >
                <option value="">All Levels</option>
                <option value="1">★ Very Easy</option>
                <option value="2">★★ Easy</option>
                <option value="3">★★★ Medium</option>
                <option value="4">★★★★ Hard</option>
                <option value="5">★★★★★ Very Hard</option>
              </select>
            </div>

            {/* Round Type Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Round Type
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
              >
                <option value="">All Rounds</option>
                <option value="aptitude">Aptitude</option>
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="coding">Coding</option>
                <option value="group_discussion">Group Discussion</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilterReset}
                className="flex-1 px-4 py-2 bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)] rounded hover:bg-[var(--surface-3)] transition text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(search || selectedCompany || selectedVerdict || selectedDifficulty || roundType) && (
            <div className="text-sm text-[var(--text-muted)]">
              Showing {experiences.length} of {total} experiences
            </div>
          )}
        </div>

        {/* Experiences Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-[var(--text-secondary)] mt-2">Loading experiences...</p>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-[var(--text-secondary)]">No experiences found matching your filters</p>
            <button
              onClick={handleFilterReset}
              className="mt-4 px-4 py-2 bg-[var(--accent)] text-[var(--text-reverse)] rounded hover:bg-[var(--accent-hover)] transition shadow-md"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {experiences.map((exp) => (
                <ExperienceCard
                  key={exp._id}
                  experience={exp}
                  onUpvoteToggle={() => handleUpvoteToggle(exp._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => fetchExperiences(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--surface-2)] transition"
                >
                  ← Previous
                </button>

                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchExperiences(p)}
                    className={`px-3 py-2 rounded transition ${
                      page === p
                        ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-md'
                        : 'border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => fetchExperiences(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-3 py-2 rounded border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--surface-2)] transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentExperiencesPage;
