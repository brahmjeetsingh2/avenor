import React, { useEffect, useMemo, useState } from 'react';
import { Award, Copy, ExternalLink, Linkedin, Pencil, Plus, Share2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import referralService from '../../services/referralService';

const DRAFT_KEY = 'avenor:referral-draft';

const emptyForm = {
  role: '',
  company: '',
  location: '',
  type: 'Full-time',
  description: '',
  link: '',
  linkedin: '',
  expiresAt: '',
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

const PostReferralModal = ({ isOpen, onClose, onSaved, editing }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        role: editing.role || '',
        company: editing.company || '',
        location: editing.location || '',
        type: editing.type || 'Full-time',
        description: editing.description || '',
        link: editing.link || '',
        linkedin: editing.linkedin || '',
        expiresAt: toDateInputValue(editing.expiresAt),
      });
      return;
    }

    const key = `${DRAFT_KEY}:${user?._id || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      setForm(emptyForm);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setForm({ ...emptyForm, ...parsed });
    } catch {
      setForm(emptyForm);
    }
  }, [editing, user?._id, isOpen]);

  useEffect(() => {
    if (!isOpen || editing) return;
    const key = `${DRAFT_KEY}:${user?._id || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(form));
  }, [form, isOpen, editing, user?._id]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.role.trim() || !form.company.trim()) {
      toast.error('Role and company are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || null,
      };

      if (editing?._id) {
        await referralService.update(editing._id, payload);
        toast.success('Referral updated');
      } else {
        await referralService.create(payload);
        toast.success('Referral posted and visible to students');
        localStorage.removeItem(`${DRAFT_KEY}:${user?._id || 'guest'}`);
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save referral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit Referral' : 'Post Referral'}
      size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={loading}>{editing ? 'Save Changes' : 'Post Referral'}</Button></>}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold">Role *</label>
            <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold">Company *</label>
            <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold">Location</label>
            <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold">Type</label>
          <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option>Full-time</option>
            <option>Internship</option>
            <option>Contract</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold">Description</label>
          <textarea className="input min-h-24" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold">Job link</label>
            <input className="input" value={form.link} onChange={(e) => set('link', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold">LinkedIn</label>
            <input className="input" value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold">Expiry date</label>
          <input type="date" className="input" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

const AlumniReferralsPage = () => {
  const [tab, setTab] = useState('mine');
  const [mine, setMine] = useState([]);
  const [browse, setBrowse] = useState([]);
  const [filters, setFilters] = useState({ type: '', company: '', status: 'active', sort: 'newest' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mineRes, browseRes] = await Promise.all([
        referralService.listMine({ sort: filters.sort, status: filters.status }),
        referralService.list(filters),
      ]);
      setMine(mineRes.data.referrals || []);
      setBrowse(browseRes.data || []);
    } catch {
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.status, filters.sort, filters.company, filters.type]);

  const rows = tab === 'mine' ? mine : browse;

  const summary = useMemo(() => ({
    total: mine.length,
    active: mine.filter((r) => r.lifecycleStatus === 'active' || r.lifecycleStatus === 'closing_soon').length,
    helped: mine.reduce((sum, r) => sum + (r.clicks || 0) + (r.saveCount || 0) + (r.applyIntentCount || 0), 0),
  }), [mine]);

  const remove = async (id) => {
    try {
      await referralService.remove(id);
      toast.success('Referral removed');
      fetchData();
    } catch {
      toast.error('Failed to remove referral');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await referralService.update(id, { status });
      toast.success('Referral status updated');
      fetchData();
    } catch {
      toast.error('Could not update status');
    }
  };

  const copyText = async (r) => {
    const text = `${r.role} at ${r.company}${r.location ? ` (${r.location})` : ''}\n${r.description || ''}\n${r.link || ''}`;
    await navigator.clipboard.writeText(text);
    toast.success('Referral text copied');
  };

  const shareWhatsApp = (r) => {
    const text = encodeURIComponent(`${r.role} at ${r.company}\n${r.description || ''}\n${r.link || ''}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = (r) => {
    const url = encodeURIComponent(r.link || window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-[1360px] mx-auto overflow-x-hidden p-4 md:p-6 page-enter space-y-5">
      <div className="hero-shell hero-shell--alumni p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Referrals</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage alumni referrals with lifecycle and impact tracking.</p>
          </div>
          <Button className="w-full sm:w-auto" leftIcon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>Post Referral</Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="card p-3"><p className="text-xs text-[var(--color-text-muted)]">Referrals posted</p><p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{summary.total}</p></div>
          <div className="card p-3"><p className="text-xs text-[var(--color-text-muted)]">Active now</p><p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{summary.active}</p></div>
          <div className="card p-3"><p className="text-xs text-[var(--color-text-muted)]">Students helped</p><p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{summary.helped}</p></div>
        </div>
      </div>

      <div className="card p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTab('mine')} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto border ${tab === 'mine' ? 'bg-coral-500 text-white border-transparent shadow-[0_14px_34px_-24px_rgba(233,95,88,.95)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]'}`}>My Referrals</button>
          <button onClick={() => setTab('browse')} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto border ${tab === 'browse' ? 'bg-coral-500 text-white border-transparent shadow-[0_14px_34px_-24px_rgba(233,95,88,.95)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]'}`}>Browse Referrals</button>

          <select className="input w-full sm:w-auto sm:min-w-36" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
            <option value="">All types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <input
            className="input w-full sm:w-auto sm:min-w-56"
            placeholder="Filter by company"
            value={filters.company}
            onChange={(e) => setFilters((p) => ({ ...p, company: e.target.value }))}
          />
          <select className="input w-full sm:w-auto sm:min-w-40" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="closing_soon">Closing soon</option>
            <option value="expired">Expired</option>
            <option value="filled">Filled</option>
          </select>
          <select className="input w-full sm:w-auto sm:min-w-40" value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}>
            <option value="newest">Newest</option>
            <option value="company">Company</option>
            <option value="impact">Impact</option>
          </select>
        </div>
      </div>

      {loading ? <div className="card p-8 text-sm text-[var(--color-text-muted)]">Loading referrals...</div> : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <Award size={24} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="font-semibold text-[var(--color-text-primary)]">Post your first referral</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">It becomes instantly visible to students from your college.</p>
          <Button className="mt-4" onClick={() => { setEditing(null); setModalOpen(true); }}>Create Referral</Button>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {rows.map((r) => (
            <div key={r._id} className="card p-4 space-y-3 hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[var(--color-text-primary)]">{r.role}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{r.company}{r.location ? ` · ${r.location}` : ''}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--accent-soft)] border border-[var(--color-border)] text-[var(--color-text-primary)]">{r.lifecycleStatus.replace('_', ' ')}</span>
              </div>

              {r.description ? <p className="text-sm text-[var(--color-text-secondary)]">{r.description}</p> : null}

              <div className="flex flex-wrap gap-2 text-xs">
                {r.link ? <a className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-semibold dark:text-[var(--color-text-primary)] dark:hover:text-white" href={r.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> Job Link</a> : null}
                {r.linkedin ? <a className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-semibold dark:text-[var(--color-text-primary)] dark:hover:text-white" href={r.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={12} /> LinkedIn</a> : null}
                <button onClick={() => copyText(r)} className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors font-semibold dark:text-[var(--color-text-primary)] dark:hover:text-white"><Copy size={12} /> Copy Text</button>
                <button onClick={() => shareWhatsApp(r)} className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors font-semibold dark:text-[var(--color-text-primary)] dark:hover:text-white"><Share2 size={12} /> WhatsApp</button>
                <button onClick={() => shareLinkedIn(r)} className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors font-semibold dark:text-[var(--color-text-primary)] dark:hover:text-white"><Share2 size={12} /> LinkedIn</button>
              </div>

              {tab === 'mine' && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-muted)]">{r.clicks || 0} clicks · {r.saveCount || 0} saves · {r.applyIntentCount || 0} apply intents</p>
                  <div className="flex items-center gap-2">
                    <select className="input !py-1 !px-2 text-xs w-full sm:w-auto" value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}>
                      <option value="active">Active</option>
                      <option value="closed">Expired</option>
                      <option value="filled">Filled</option>
                    </select>
                    <button className="p-2 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]" onClick={() => { setEditing(r); setModalOpen(true); }}><Pencil size={13} /></button>
                    <button className="p-2 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--danger)] transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:text-[#fca5a5] dark:hover:bg-[rgba(239,68,68,0.16)]" onClick={() => remove(r._id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PostReferralModal
        isOpen={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
};

export default AlumniReferralsPage;
