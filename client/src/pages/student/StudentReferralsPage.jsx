import React, { useEffect, useMemo, useState } from 'react';
import { Award, Building2, Copy, ExternalLink, Linkedin, MapPin, MessageSquare, Bookmark, BookmarkCheck, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import referralService from '../../services/referralService';
import mentorshipService from '../../services/mentorshipService';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const topicOptions = [
  { value: 'interview_prep', label: 'Interview Prep' },
  { value: 'resume_review', label: 'Resume Review' },
  { value: 'career_guidance', label: 'Career Guidance' },
  { value: 'referral_help', label: 'Referral Help' },
  { value: 'general', label: 'General' },
];

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedSurfaceAlt = 'linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 92%, var(--text-primary) 8%) 0%, color-mix(in srgb, var(--surface-3) 90%, var(--text-primary) 10%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';
const themedAccentWash = 'color-mix(in srgb, var(--accent) 9%, var(--surface) 91%)';

const StudentReferralsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', company: '', location: '', status: 'active', sort: 'newest' });
  const [requestModal, setRequestModal] = useState({ open: false, referral: null });
  const [requestForm, setRequestForm] = useState({ topic: 'interview_prep', message: '', preferredTime: '' });
  const [requesting, setRequesting] = useState(false);
  const [savedReferralIds, setSavedReferralIds] = useState([]);
  const [hiddenReferralIds, setHiddenReferralIds] = useState([]);
  const [viewMode, setViewMode] = useState('visible');

  const fetchRows = async () => {
    setLoading(true);
    try {
      const [referralsRes, prefRes] = await Promise.all([
        referralService.list(filters),
        authService.getReferralPreferences().catch(() => ({ data: { savedReferralIds: [], hiddenReferralIds: [] } })),
      ]);
      setRows(Array.isArray(referralsRes.data) ? referralsRes.data : []);
      setSavedReferralIds(prefRes.data?.savedReferralIds || []);
      setHiddenReferralIds(prefRes.data?.hiddenReferralIds || []);
    } catch {
      toast.error('Could not load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [filters.type, filters.company, filters.location, filters.status, filters.sort]);

  const visibleRows = useMemo(
    () => rows.filter((row) => !hiddenReferralIds.includes(row._id)),
    [rows, hiddenReferralIds]
  );

  const savedRows = useMemo(
    () => rows.filter((row) => savedReferralIds.includes(row._id)),
    [rows, savedReferralIds]
  );

  const hiddenRows = useMemo(
    () => rows.filter((row) => hiddenReferralIds.includes(row._id)),
    [rows, hiddenReferralIds]
  );

  const displayedRows = viewMode === 'hidden'
    ? hiddenRows
    : (viewMode === 'saved' ? savedRows : visibleRows);

  const copyReferral = async (r) => {
    const text = `${r.role} at ${r.company}${r.location ? ` (${r.location})` : ''}\n${r.description || ''}\n${r.link || ''}`;
    await navigator.clipboard.writeText(text);
    await referralService.trackIntent(r._id, 'save');
    toast.success('Referral copied and saved');
  };

  const togglePreference = async (referral, action) => {
    try {
      const res = await authService.toggleReferralPreference(referral._id, action);
      setSavedReferralIds(res.data?.savedReferralIds || []);
      setHiddenReferralIds(res.data?.hiddenReferralIds || []);
      toast.success(res.message || (action === 'save' ? 'Referral saved' : 'Referral hidden'));
    } catch {
      toast.error(`Could not ${action} referral`);
    }
  };

  const openLink = async (r) => {
    try {
      await referralService.trackClick(r._id);
      await referralService.trackIntent(r._id, 'apply_intent');
    } catch {}

    window.open(r.link, '_blank', 'noopener,noreferrer');
  };

  const openMentorshipModal = (referral) => {
    setRequestForm({
      topic: 'interview_prep',
      message: `Hi ${referral.postedBy?.name || 'Alumni'}, I need guidance related to ${referral.role} at ${referral.company}.`,
      preferredTime: '',
    });
    setRequestModal({ open: true, referral });
  };

  const submitMentorshipRequest = async () => {
    if (!requestModal.referral?.postedBy?._id) {
      toast.error('This referral does not have an alumni owner attached');
      return;
    }
    if (!requestForm.message.trim()) {
      toast.error('Please add your request message');
      return;
    }

    setRequesting(true);
    try {
      await mentorshipService.request({
        alumniId: requestModal.referral.postedBy._id,
        topic: requestForm.topic,
        message: requestForm.message,
        preferredTime: requestForm.preferredTime,
        referralId: requestModal.referral._id,
      });
      await referralService.trackIntent(requestModal.referral._id, 'contact_intent');
      toast.success('Mentorship request sent');
      setRequestModal({ open: false, referral: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send mentorship request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 page-enter space-y-5">
      <div className="card space-y-4 p-5 md:p-6" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Referrals</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Opportunities shared by alumni from your college.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] text-[var(--accent)] text-sm font-semibold shadow-[var(--shadow-soft)]" style={{ background: themedWash }}>
          <Award size={15} />
          {rows.length} referral{rows.length !== 1 ? 's' : ''}
        </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--color-border)] p-3" style={{ background: themedAccentWash }}>
            <p className="text-xs text-[var(--color-text-muted)]">Available now</p>
            <p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{visibleRows.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3" style={{ background: themedSurfaceAlt }}>
            <p className="text-xs text-[var(--color-text-muted)]">Saved referrals</p>
            <p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{savedReferralIds.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3" style={{ background: themedSurfaceAlt }}>
            <p className="text-xs text-[var(--color-text-muted)]">Hidden referrals</p>
            <p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{hiddenReferralIds.length}</p>
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-5 flex flex-wrap gap-2 items-center" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[var(--color-border)] mr-1" style={{ background: themedWash }}>
          <button
            type="button"
            onClick={() => setViewMode('visible')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-transparent dark:border-[rgba(255,255,255,0.06)]"
            style={{
              background: viewMode === 'visible' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'visible' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'visible' ? 'var(--shadow-soft)' : 'none',
            }}
          >
            Visible ({visibleRows.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('saved')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-transparent dark:border-[rgba(255,255,255,0.06)]"
            style={{
              background: viewMode === 'saved' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'saved' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'saved' ? 'var(--shadow-soft)' : 'none',
            }}
          >
            Saved ({savedRows.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('hidden')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-transparent dark:border-[rgba(255,255,255,0.06)]"
            style={{
              background: viewMode === 'hidden' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'hidden' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'hidden' ? 'var(--shadow-soft)' : 'none',
            }}
          >
            Hidden ({hiddenRows.length})
          </button>
        </div>
        <select className="input max-w-40" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
          <option value="">All types</option>
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
        </select>
        <input className="input max-w-56" placeholder="Filter by company" value={filters.company} onChange={(e) => setFilters((p) => ({ ...p, company: e.target.value }))} />
        <input className="input max-w-56" placeholder="Filter by location" value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))} />
        <select className="input max-w-40" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
          <option value="active">Active</option>
          <option value="closing_soon">Closing soon</option>
          <option value="expired">Expired</option>
          <option value="filled">Filled</option>
        </select>
        <select className="input max-w-40" value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}>
          <option value="newest">Newest</option>
          <option value="company">Company</option>
          <option value="impact">Most engaged</option>
          <option value="location">Location</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-8 text-sm" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>Loading referrals...</div>
      ) : displayedRows.length === 0 ? (
        <div className="card p-12 text-center" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <Award size={24} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="font-bold text-[var(--color-text-primary)] mb-1">{viewMode === 'hidden' ? 'No hidden referrals' : (viewMode === 'saved' ? 'No saved referrals' : 'No referrals available yet')}</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-5">
            {viewMode === 'hidden'
              ? 'Hidden referrals will appear here. You can unhide them anytime.'
              : (viewMode === 'saved'
                ? 'Saved referrals will appear here. You can unsave them anytime.'
                : 'Alumni referrals will appear here as soon as they are posted.')}
          </p>
          <Button variant="secondary" onClick={fetchRows}>Refresh Referrals</Button>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {displayedRows.map((r) => {
            const isSaved = savedReferralIds.includes(r._id);
            const isHidden = hiddenReferralIds.includes(r._id);
            return (
            <div key={r._id} className="card p-5 space-y-3 hover-lift hover:border-[var(--accent)]/25 hover:shadow-[var(--shadow-hover)] transition-all duration-300" style={{ background: themedSurface }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[var(--color-text-primary)]">{r.role}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5 flex-wrap">
                    <Building2 size={13} />
                    {r.company}
                    {r.location && <><span>·</span><MapPin size={13} />{r.location}</>}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-[var(--surface-2)] border-[var(--color-border)] text-[var(--accent)] shadow-sm">
                  {r.type} · {r.lifecycleStatus.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm">
                  {r.expiresAt ? `Expires ${new Date(r.expiresAt).toLocaleDateString('en-IN')}` : 'No expiry'}
                </span>
                {r.lifecycleStatus === 'closing_soon' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]">
                    Closing soon
                  </span>
                )}
                {r.lifecycleStatus === 'expired' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]">
                    Expired
                  </span>
                )}
              </div>

              {r.description && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.description}</p>}

              {r.postedBy?.name && (
                <p className="text-xs text-[var(--color-text-muted)]">Shared by {r.postedBy.name}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--color-border)]">
                {r.link && (
                  <button onClick={() => openLink(r)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors rounded-lg px-2 py-1 hover:bg-[var(--surface-2)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]">
                    <ExternalLink size={12} /> Apply Here
                  </button>
                )}
                {r.linkedin && (
                  <a href={r.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors rounded-lg px-2 py-1 hover:bg-[var(--surface-2)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]">
                    <Linkedin size={12} /> Contact Alumni
                  </a>
                )}
                {r.postedBy?._id && (
                  <button onClick={() => openMentorshipModal(r)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors rounded-lg px-2 py-1 hover:bg-[var(--surface-2)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]">
                    <MessageSquare size={12} /> Request Mentorship
                  </button>
                )}
                <button onClick={() => togglePreference(r, 'save')} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg px-2 py-1 hover:bg-[var(--surface-2)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]">
                  {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />} {isSaved ? 'Unsave' : 'Save'}
                </button>
                <button onClick={() => togglePreference(r, 'hide')} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--danger)] transition-colors rounded-lg px-2 py-1 hover:bg-[var(--surface-2)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]">
                  <EyeOff size={12} /> {isHidden ? 'Unhide' : 'Hide'}
                </button>
                <button onClick={() => copyReferral(r)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors ml-auto rounded-lg px-2 py-1 hover:bg-[var(--surface-2)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]">
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={requestModal.open}
        onClose={() => setRequestModal({ open: false, referral: null })}
        title="Request Mentorship"
        footer={<><Button variant="ghost" onClick={() => setRequestModal({ open: false, referral: null })}>Cancel</Button><Button onClick={submitMentorshipRequest} loading={requesting}>Send Request</Button></>}
      >
        <div className="space-y-3">
          <div className="text-sm text-[var(--color-text-muted)]">
            Requesting guidance for <span className="font-semibold text-[var(--color-text-primary)]">{requestModal.referral?.role}</span> at <span className="font-semibold text-[var(--color-text-primary)]">{requestModal.referral?.company}</span>.
          </div>
          <div>
            <label className="text-xs font-semibold">Topic</label>
            <select className="input" value={requestForm.topic} onChange={(e) => setRequestForm((p) => ({ ...p, topic: e.target.value }))}>
              {topicOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Message</label>
            <textarea className="input min-h-28" value={requestForm.message} onChange={(e) => setRequestForm((p) => ({ ...p, message: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold">Preferred Time (optional)</label>
            <input className="input" placeholder="e.g. Weekends after 6 PM" value={requestForm.preferredTime} onChange={(e) => setRequestForm((p) => ({ ...p, preferredTime: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentReferralsPage;
