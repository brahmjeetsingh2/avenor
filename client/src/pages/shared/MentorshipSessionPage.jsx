import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarCheck2, Check, Clock, MessageSquare, Target, X } from 'lucide-react';
import toast from 'react-hot-toast';
import mentorshipService from '../../services/mentorshipService';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

const MentorshipSessionPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateText, setUpdateText] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const isAlumni = user?.role === 'alumni';
  const isStudent = user?.role === 'student';

  const load = async () => {
    setLoading(true);
    try {
      const res = await mentorshipService.getById(id);
      const req = res.data.request;
      setRequest(req);
      if (req?.session?.targetDate) {
        setTargetDate(new Date(req.session.targetDate).toISOString().slice(0, 10));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load mentorship session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const counterpart = useMemo(() => (isAlumni ? request?.student : request?.alumni), [isAlumni, request]);

  const updateStatus = async (status) => {
    try {
      await mentorshipService.updateStatus(id, {
        status,
        targetDate: status === 'accepted' ? targetDate : undefined,
      });
      toast.success(`Mentorship ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  const cancel = async () => {
    try {
      await mentorshipService.cancel(id);
      toast.success('Request cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel request');
    }
  };

  const toggleMilestone = async (milestone) => {
    const next = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      await mentorshipService.updateMilestone(id, milestone._id, { status: next });
      toast.success('Milestone updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update milestone');
    }
  };

  const addUpdate = async () => {
    if (!updateText.trim()) return;
    try {
      await mentorshipService.addUpdate(id, { message: updateText.trim() });
      setUpdateText('');
      toast.success('Update posted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post update');
    }
  };

  if (loading || !request) {
    return <div className="max-w-5xl mx-auto p-6"><div className="card p-8 text-sm text-[var(--text-muted)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>Loading mentorship session...</div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 page-enter space-y-5">
      <div className="card p-5 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Mentorship Session</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {request.topic.replace('_', ' ')} · with {counterpart?.name || 'Participant'} · <span className={`text-xs font-semibold px-2 py-1 rounded border ${request.status === 'accepted' || request.status === 'completed' ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]' : request.status === 'pending' ? 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]' : 'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]'}`}>{request.status}</span>
        </p>
        <div className="mt-3 text-sm text-[var(--text-secondary)]">
          <p>{request.message}</p>
          {request.preferredTime ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] px-2.5 py-1.5 rounded-lg" style={{background: themedWash}}><Clock size={13} /> Preferred: {request.preferredTime}</p> : null}
        </div>
      </div>

      {request.session?.isActive ? (
        <div className="rounded-xl border border-[var(--success-border)] p-4 flex items-start justify-between" style={{ background: 'color-mix(in srgb, var(--success-bg) 50%, var(--surface) 50%)' }}>
          <div>
            <p className="font-semibold text-[var(--success)] inline-flex items-center gap-2"><CalendarCheck2 size={16} /> Session Active</p>
            <p className="text-sm text-[var(--success)] mt-2 font-medium">Progress: {request.sessionProgress?.completed || 0}/{request.sessionProgress?.total || 0} milestones ({request.sessionProgress?.percent || 0}%)</p>
            {request.session?.targetDate ? <p className="text-xs text-[var(--success)] mt-1.5">Target Completion: {new Date(request.session.targetDate).toLocaleDateString('en-IN')}</p> : null}
          </div>
          <div className="text-2xl">✓</div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-4 space-y-3 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <h2 className="font-display font-bold text-base text-[var(--text-primary)] inline-flex items-center gap-2"><Target size={15} /> Milestones</h2>
          {request.session?.milestones?.length ? request.session.milestones.map((m) => (
            <button
              key={m._id}
              type="button"
              onClick={() => isAlumni && request.session?.isActive ? toggleMilestone(m) : null}
              className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${m.status === 'completed' ? 'border-[var(--success-border)] bg-[color-mix(in_srgb,var(--success-bg)_50%,var(--surface)_50%)]' : 'border-[var(--border)] bg-[var(--surface-2)]'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">{m.title}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${m.status === 'completed' ? 'border-[var(--success-border)] text-[var(--success)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>{m.status}</span>
              </div>
            </button>
          )) : <p className="text-sm text-[var(--text-muted)]">Milestones will appear once session is accepted.</p>}
        </div>

        <div className="card p-4 space-y-3 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <h2 className="font-display font-bold text-base text-[var(--text-primary)] inline-flex items-center gap-2"><MessageSquare size={15} /> Timeline</h2>
          {request.session?.updates?.length ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {request.session.updates.map((u, idx) => (
                <div key={`${u.createdAt || idx}-${idx}`} className="rounded-lg border border-[var(--border)] p-3 text-sm" style={{background: themedWash}}>
                  <p><span className="font-semibold text-[var(--text-primary)] capitalize">{u.actorRole}</span><span className="text-[var(--text-secondary)]">: {u.message}</span></p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{u.by?.name || 'User'} · {u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN') : ''}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[var(--text-muted)]">No updates yet. Start collaborating!</p>}

          <div className="flex gap-2 pt-2">
            <input className="input flex-1 text-sm" placeholder="Post an update..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
            <Button size="sm" onClick={addUpdate}>Post</Button>
          </div>
        </div>
      </div>

      <div className="card p-4 border-[var(--border)] space-y-3" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</p>
        <div className="flex flex-wrap gap-2">
          {isAlumni && request.status === 'pending' ? (
            <>
              <input className="input text-sm" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              <Button size="sm" leftIcon={<Check size={13} />} onClick={() => updateStatus('accepted')}>Accept & Activate</Button>
              <Button size="sm" variant="secondary" leftIcon={<X size={13} />} onClick={() => updateStatus('declined')}>Decline</Button>
            </>
          ) : null}

          {isAlumni && request.status === 'accepted' ? (
            <Button size="sm" leftIcon={<Check size={13} />} onClick={() => updateStatus('completed')}>Mark Completed</Button>
          ) : null}

          {isStudent && ['pending', 'accepted'].includes(request.status) ? (
            <Button size="sm" variant="secondary" leftIcon={<X size={13} />} onClick={cancel}>Cancel Request</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MentorshipSessionPage;
