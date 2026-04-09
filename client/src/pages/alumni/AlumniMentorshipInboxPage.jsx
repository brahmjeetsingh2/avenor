import React, { useEffect, useState } from 'react';
import { Check, Clock, MessageSquare, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import mentorshipService from '../../services/mentorshipService';
import Button from '../../components/ui/Button';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusTone = {
  pending: 'bg-[var(--warning-bg)] border border-[var(--warning-border)] text-[var(--warning)]',
  accepted: 'bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success)]',
  completed: 'bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success)]',
  declined: 'bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger)]',
  cancelled: 'bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger)]',
};

const AlumniMentorshipInboxPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [targetDates, setTargetDates] = useState({});
  const [updateText, setUpdateText] = useState({});

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await mentorshipService.getInbox({ status: statusFilter || undefined, limit: 100 });
      setRows(res.data || []);
    } catch {
      toast.error('Failed to load mentorship inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [statusFilter]);

  const updateStatus = async (row, status) => {
    try {
      await mentorshipService.updateStatus(row._id, {
        status,
        targetDate: status === 'accepted' ? targetDates[row._id] : undefined,
      });
      toast.success(`Request marked ${status}`);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update request');
    }
  };

  const toggleMilestone = async (row, milestone) => {
    const next = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      await mentorshipService.updateMilestone(row._id, milestone._id, { status: next });
      toast.success('Milestone updated');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update milestone');
    }
  };

  const addUpdate = async (row) => {
    const message = (updateText[row._id] || '').trim();
    if (!message) return;

    try {
      await mentorshipService.addUpdate(row._id, { message });
      setUpdateText((p) => ({ ...p, [row._id]: '' }));
      toast.success('Session update posted');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add update');
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto overflow-x-hidden p-4 md:p-6 page-enter space-y-5">
      <div className="hero-shell hero-shell--alumni p-5">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Mentorship Inbox</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Respond to students requesting guidance from alumni.</p>
        <div className="mt-3">
          <select className="input w-full sm:w-auto sm:min-w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-sm text-[var(--color-text-muted)]">Loading mentorship requests...</div>
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={24} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="font-semibold text-[var(--color-text-primary)]">No mentorship requests yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">When students request guidance, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {rows.map((r) => (
            <div key={r._id} className="card p-4 space-y-3 hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{r.student?.name || 'Student'} · {r.topic.replace('_', ' ')}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{r.student?.branch || 'Branch'} · {r.student?.batch || 'Batch'} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusTone[r.status] || 'bg-[var(--accent-soft)] border border-[var(--color-border)] text-[var(--color-text-primary)]'}`}>{r.status}</span>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)]">{r.message}</p>
              {r.preferredTime ? <p className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1"><Clock size={12} /> Preferred: {r.preferredTime}</p> : null}

              {['pending', 'accepted'].includes(r.status) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                  {r.status === 'pending' ? (
                    <>
                      <input
                        className="input w-full sm:w-auto sm:min-w-56"
                        type="date"
                        value={targetDates[r._id] || ''}
                        onChange={(e) => setTargetDates((p) => ({ ...p, [r._id]: e.target.value }))}
                      />
                      <Button className="w-full sm:w-auto" size="sm" leftIcon={<Check size={13} />} onClick={() => updateStatus(r, 'accepted')}>Accept</Button>
                      <Button className="w-full sm:w-auto" size="sm" variant="secondary" leftIcon={<X size={13} />} onClick={() => updateStatus(r, 'declined')}>Decline</Button>
                    </>
                  ) : (
                    <Button className="w-full sm:w-auto" size="sm" leftIcon={<Check size={13} />} onClick={() => updateStatus(r, 'completed')}>Mark Completed</Button>
                  )}
                </div>
              )}

              {r.session?.isActive && (
                <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
                  <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm text-[var(--color-text-primary)]">
                    Mentorship Session Active · Progress {r.sessionProgress?.completed || 0}/{r.sessionProgress?.total || 0}
                    {r.session?.targetDate ? ` · Target ${new Date(r.session.targetDate).toLocaleDateString('en-IN')}` : ''}
                  </div>

                  <div className="space-y-2">
                    {(r.session?.milestones || []).map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => toggleMilestone(r, m)}
                        className={`w-full text-left rounded-xl border p-3 text-sm ${m.status === 'completed' ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--color-text-primary)]' : 'border-[var(--color-border)] bg-[var(--surface-2)] text-[var(--color-text-secondary)]'}`}
                      >
                        <span className="font-semibold">{m.title}</span>
                        <span className="ml-2 text-xs text-[var(--color-text-muted)]">{m.status}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      className="input w-full sm:flex-1"
                      placeholder="Post session update"
                      value={updateText[r._id] || ''}
                      onChange={(e) => setUpdateText((p) => ({ ...p, [r._id]: e.target.value }))}
                    />
                    <Button className="w-full sm:w-auto" size="sm" onClick={() => addUpdate(r)}>Add</Button>
                  </div>
                </div>
              )}

              <div className="pt-1 border-t border-[var(--color-border)]">
                <Link to={`/mentorship/${r._id}`} className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]">Open Session Workspace</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniMentorshipInboxPage;
