import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Trash2 } from 'lucide-react';
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

const statusTone = (status) => {
  if (status === 'accepted' || status === 'completed') {
    return 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]';
  }
  if (status === 'declined' || status === 'cancelled') {
    return 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]';
  }
  if (status === 'pending') {
    return 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]';
  }
  return 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]';
};

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedSurfaceAlt = 'linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 92%, var(--text-primary) 8%) 0%, color-mix(in srgb, var(--surface-3) 90%, var(--text-primary) 10%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';
const themedLink = 'color-mix(in srgb, var(--accent) 88%, transparent 12%)';

const StudentMentorshipRequestsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updateText, setUpdateText] = useState({});

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await mentorshipService.getMine({ status: statusFilter || undefined, limit: 100 });
      setRows(res.data || []);
    } catch {
      toast.error('Failed to load mentorship requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [statusFilter]);

  const cancel = async (id) => {
    try {
      await mentorshipService.cancel(id);
      toast.success('Request cancelled');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel request');
    }
  };

  const deleteRequest = async (id) => {
    try {
      await mentorshipService.delete(id);
      toast.success('Request deleted');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete request');
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

  const summary = {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    active: rows.filter((r) => r.status === 'accepted' && r.session?.isActive).length,
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 page-enter space-y-5">
      <div className="card p-5 md:p-6 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">My Mentorship Requests</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Track the status of mentorship requests sent to alumni.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--accent)] text-sm font-semibold" style={{ background: themedWash }}>
            <MessageSquare size={15} />
            {summary.total} request{summary.total !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl border border-[var(--border)] p-3" style={{ background: themedSurfaceAlt }}>
            <p className="text-xs text-[var(--text-muted)] font-medium">Total</p>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-[var(--warning-border)] p-3" style={{ background: 'color-mix(in srgb, var(--warning-bg) 50%, var(--surface) 50%)' }}>
            <p className="text-xs text-[var(--text-muted)] font-medium">Pending</p>
            <p className="font-display text-2xl font-bold text-[var(--warning)] mt-1">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-[var(--success-border)] p-3" style={{ background: 'color-mix(in srgb, var(--success-bg) 50%, var(--surface) 50%)' }}>
            <p className="text-xs text-[var(--text-muted)] font-medium">Active Sessions</p>
            <p className="font-display text-2xl font-bold text-[var(--success)] mt-1">{summary.active}</p>
          </div>
        </div>

        <div className="mt-4">
          <select className="input max-w-48 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-sm text-[var(--text-muted)] border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>Loading mentorship requests...</div>
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl border border-[var(--border)]" style={{ width: 56, height: 56, background: themedWash }}>
            <MessageSquare size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="font-semibold text-[var(--text-primary)]">No mentorship requests yet</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">Request mentorship from alumni on referrals or their profile context.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r._id} className="card p-4 space-y-3 border-[var(--border)] hover:shadow-[var(--shadow-hover)] transition-shadow" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-primary)]">{r.alumni?.name || 'Alumni'} · <span className="text-[var(--text-secondary)]">{r.topic.replace('_', ' ')}</span></p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{r.alumni?.college || ''} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap ${statusTone(r.status)}`}>{r.status}</span>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">{r.message}</p>
              {r.responseNote ? <p className="text-xs text-[var(--text-muted)] italic">Response: {r.responseNote}</p> : null}

              {r.status === 'accepted' && r.session?.isActive && (
                <div className="rounded-xl border border-[var(--success-border)] p-3 text-sm font-medium" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  ✓ Mentorship Session Activated · {r.sessionProgress?.completed || 0}/{r.sessionProgress?.total || 0} milestones completed
                </div>
              )}

              {r.session?.milestones?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Milestones</p>
                  {r.session.milestones.map((m) => (
                    <div key={m._id} className={`rounded-lg border p-3 text-sm transition-colors ${m.status === 'completed' ? 'border-[var(--success-border)] bg-[color-mix(in_srgb,var(--success-bg)_50%,var(--surface)_50%)]' : 'border-[var(--border)] bg-[var(--surface-2)]'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-[var(--text-primary)]">{m.title}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${m.status === 'completed' ? 'border-[var(--success-border)] text-[var(--success)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {r.session?.updates?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Session Updates</p>
                  <div className="space-y-1.5">
                    {r.session.updates.slice(-4).map((u, idx) => (
                      <div key={`${u.createdAt || idx}-${idx}`} className="text-xs rounded-lg border border-[var(--border)] px-3 py-2" style={{ background: themedWash }}>
                        <span className="font-semibold text-[var(--text-primary)] capitalize">{u.actorRole}</span>
                        <span className="text-[var(--text-secondary)]">: {u.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {r.session?.isActive && (
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Add a session update..."
                    value={updateText[r._id] || ''}
                    onChange={(e) => setUpdateText((p) => ({ ...p, [r._id]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => addUpdate(r)}>Post</Button>
                </div>
              )}

              {['pending', 'accepted'].includes(r.status) && (
                <div className="pt-2.5 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="secondary" leftIcon={<X size={13} />} onClick={() => cancel(r._id)}>Cancel</Button>
                    <Link to={`/mentorship/${r._id}`} className="text-xs font-semibold text-[var(--accent)] hover:opacity-100 opacity-90 rounded px-2.5 py-1.5 transition-opacity">Open Session</Link>
                    <Button size="sm" variant="secondary" leftIcon={<Trash2 size={13} />} onClick={() => deleteRequest(r._id)}>Delete</Button>
                  </div>
                </div>
              )}

              {!['pending', 'accepted'].includes(r.status) && (
                <div className="pt-2.5 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link to={`/mentorship/${r._id}`} className="text-xs font-semibold text-[var(--accent)] hover:opacity-100 opacity-90 rounded px-2.5 py-1.5 transition-opacity">Open Session</Link>
                    <Button size="sm" variant="secondary" leftIcon={<Trash2 size={13} />} onClick={() => deleteRequest(r._id)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMentorshipRequestsPage;
