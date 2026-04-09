import React, { useState, useEffect } from 'react';
import { BrainCircuit, Building2, CalendarClock, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../services/api';

const inlineEmphasis = (text) => {
  const chunks = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return chunks.map((chunk, idx) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-[var(--text-primary)]">{chunk.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={idx}>{chunk}</React.Fragment>;
  });
};

const cleanLine = (line) => line
  .replace(/^#{1,6}\s*/, '')
  .replace(/^\*\*\s*/, '')
  .replace(/\s*\*\*$/, '')
  .trim();

const renderRichText = (content) => {
  const text = String(content || '').replace(/\r/g, '').trim();
  if (!text) return null;

  const blocks = text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const allBullets = lines.length > 1 && lines.every((l) => /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l));

        if (allBullets) {
          return (
            <ul key={idx} className="space-y-2">
              {lines.map((line, li) => (
                <li key={li} className="text-sm leading-relaxed text-[var(--text-secondary)] flex gap-2">
                  <span className="text-[var(--accent)]">•</span>
                  <span>{inlineEmphasis(cleanLine(line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '')))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (/^#{1,6}\s+/.test(lines[0])) {
          return (
            <div key={idx} className="space-y-2">
              <h4 className="text-base font-bold text-[var(--text-primary)] tracking-tight">{inlineEmphasis(cleanLine(lines[0]))}</h4>
              {lines.slice(1).length > 0 && (
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                  {inlineEmphasis(lines.slice(1).map(cleanLine).join('\n'))}
                </p>
              )}
            </div>
          );
        }

        return (
          <p key={idx} className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
            {inlineEmphasis(lines.map(cleanLine).join('\n'))}
          </p>
        );
      })}
    </div>
  );
};

const StudentAIPrepPage = ({ embedded = false }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState(''); // 'interview_prep', 'mock_interview', ''
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const limit = 10;

  // Fetch AI history
  const fetchHistory = async (pageNum) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit,
        ...(filterType && { type: filterType }),
      });

      const response = await api.get(`/ai/history?${params}`);
      const payload = response.data?.data || {};
      setHistory(payload.history || []);
      setTotal(response.data?.pagination?.total || 0);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHistory(1);
  }, [filterType]);

  // Handle feedback
  const handleFeedback = async (historyId, isHelpful) => {
    try {
      await api.patch(`/ai/history/${historyId}/feedback`, { isHelpful });

      // Update local state
      setHistory(prev =>
        prev.map(h => (h._id === historyId ? { ...h, isHelpful } : h))
      );

      if (selectedItem?._id === historyId) {
        setSelectedItem(prev => ({ ...prev, isHelpful }));
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const pages = Math.ceil(total / limit);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'interview_prep':
        return 'Interview Prep';
      case 'mock_interview':
        return 'Mock Interview';
      case 'resume_feedback':
        return 'Resume Feedback';
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'interview_prep':
        return 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]';
      case 'mock_interview':
        return 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]';
      case 'resume_feedback':
        return 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]';
      default:
        return 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'interview_prep':
        return 'IP';
      case 'mock_interview':
        return 'MI';
      case 'resume_feedback':
        return 'RF';
      default:
        return 'AI';
    }
  };

  useEffect(() => {
    if (!selectedItem && history.length > 0) {
      setSelectedItem(history[0]);
    }
    if (selectedItem && history.length > 0 && !history.find((h) => h._id === selectedItem._id)) {
      setSelectedItem(history[0]);
    }
  }, [history, selectedItem]);

  return (
    <div className={embedded ? '' : 'min-h-screen bg-[var(--bg)] p-4 md:p-6 page-enter'}>
      <div className={embedded ? '' : 'max-w-6xl mx-auto space-y-6'}>
        {!embedded && (
          <div className="card hero-shell hero-shell--student p-6 border-[var(--color-border)]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BrainCircuit size={22} className="text-[var(--accent)]" /> AI Prep History
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl">
                  Review your past prep sessions, mock interviews, and feedback in one structured view.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
                {total} activities recorded
              </div>
            </div>
          </div>
        )}

        <div className="card p-4 md:p-5 mb-2 md:mb-3">
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setFilterType('')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filterType === ''
                  ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-md'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]'
              }`}
            >
              All Activities
            </button>
            <button
              onClick={() => setFilterType('interview_prep')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filterType === 'interview_prep'
                  ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-md'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]'
              }`}
            >
              Interview Prep
            </button>
            <button
              onClick={() => setFilterType('mock_interview')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filterType === 'mock_interview'
                  ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-md'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]'
              }`}
            >
              Mock Interview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
          <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-24 self-start">
            {loading ? (
              <div className="card p-6 text-center text-sm text-[var(--text-secondary)]">Loading activity history...</div>
            ) : history.length === 0 ? (
              <div className="card p-8 text-center">
                <Sparkles size={20} className="mx-auto text-[var(--text-muted)]" />
                <p className="mt-3 font-semibold text-[var(--text-primary)]">No activity yet</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Run an AI prep session to start building your history.</p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all hover-lift ${
                    selectedItem?._id === item._id
                      ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--shadow-hover)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-[var(--surface-2)] text-[11px] font-bold text-[var(--accent)] inline-flex items-center justify-center shrink-0">
                      {getTypeIcon(item.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.role}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{item.company?.name || 'Unknown Company'}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                      {item.performanceScore !== null && (
                        <p className="text-[11px] font-semibold text-[var(--accent)] mt-1">Score {item.performanceScore}%</p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
                  </div>
                </button>
              ))
            )}

            {pages > 1 && (
              <div className="card p-3 flex items-center justify-between">
                <button
                  onClick={() => fetchHistory(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--surface-2)] transition text-sm"
                >
                  Previous
                </button>
                <span className="text-xs text-[var(--text-muted)] font-semibold">Page {page} of {pages}</span>
                <button
                  onClick={() => fetchHistory(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--surface-2)] transition text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {selectedItem ? (
            <div className="lg:col-span-2 space-y-5">
              <div className="card p-6 reveal-up-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedItem.type)}`}>
                    {getTypeLabel(selectedItem.type)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
                    <CalendarClock size={12} />
                    {new Date(selectedItem.createdAt).toLocaleDateString()} {new Date(selectedItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{selectedItem.role}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1 inline-flex items-center gap-1"><Building2 size={13} /> {selectedItem.company?.name || 'Unknown Company'}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getTypeColor(selectedItem.type)}`}>
                    {getTypeLabel(selectedItem.type)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--color-border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
                    {selectedItem.company?.name || 'Unknown Company'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--color-border)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </span>
                  {selectedItem.performanceScore !== null && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]">
                      Score {selectedItem.performanceScore}%
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      selectedItem.isHelpful === true
                        ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]'
                        : selectedItem.isHelpful === false
                          ? 'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]'
                          : 'border-[var(--color-border)] bg-[var(--surface-2)] text-[var(--text-muted)]'
                    }`}
                  >
                    {selectedItem.isHelpful === true ? 'Marked helpful' : selectedItem.isHelpful === false ? 'Marked not helpful' : 'Feedback pending'}
                  </span>
                </div>

                {selectedItem.performanceScore !== null && (
                  <div className="mt-5 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--surface-2)]">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[var(--text-secondary)]">Performance Score</span>
                      <span className="font-bold text-[var(--accent)]">{selectedItem.performanceScore}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div className="h-full bg-[var(--accent)]" style={{ width: `${selectedItem.performanceScore}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {selectedItem.keyTakeaways?.length > 0 && (
                <div className="card p-6 reveal-up-sm">
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">Key Takeaways</h3>
                  <ul className="space-y-2">
                    {selectedItem.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-[var(--success)]">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.questionsAsked?.length > 0 && (
                <div className="card p-6 reveal-up-sm">
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">Questions Asked</h3>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-[var(--text-secondary)]">
                    {selectedItem.questionsAsked.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedItem.notes && (
                <div className="card p-6 reveal-up-sm">
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">Notes</h3>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-2)] p-4">
                    {renderRichText(selectedItem.notes)}
                  </div>
                </div>
              )}

              {selectedItem.prepContent && (
                <div className="card p-6 reveal-up-sm">
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">Generated Content</h3>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-2)] p-4 md:p-5">
                    {renderRichText(selectedItem.prepContent.slice(0, 2400))}
                    {selectedItem.prepContent.length > 2400 && (
                      <p className="mt-3 text-xs font-semibold text-[var(--text-muted)]">Content truncated for quick reading.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="card p-6 reveal-up-sm">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">Was this helpful?</h3>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleFeedback(selectedItem._id, true)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      selectedItem.isHelpful === true
                        ? 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]'
                    }`}
                  >
                    Helpful
                  </button>
                  <button
                    onClick={() => handleFeedback(selectedItem._id, false)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      selectedItem.isHelpful === false
                        ? 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]'
                    }`}
                  >
                    Needs Improvement
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 card p-10 text-center">
              <p className="font-semibold text-[var(--text-primary)]">Select an activity to view details</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Your full AI prep context will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAIPrepPage;
