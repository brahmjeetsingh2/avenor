import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Pencil, Trash2, Plus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { salaryService } from '../../services/salaryService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SalaryInsightsPage from '../shared/SalaryInsightsPage';

const EditSalaryModal = ({ open, onClose, row, onSaved }) => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row) return;
    setForm({
      role: row.role || '',
      ctc: row.ctc || 0,
      base: row.base || 0,
      bonus: row.bonus || 0,
      stockOptions: row.stockOptions || 0,
      joiningBonus: row.joiningBonus || 0,
      location: row.location || '',
      year: row.year || new Date().getFullYear(),
      batch: row.batch || '',
      bond: row.bond || { hasBond: false, duration: 0, amount: 0 },
    });
  }, [row]);

  if (!row || !form) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setLoading(true);
    try {
      await salaryService.update(row._id, {
        ...form,
        ctc: Number(form.ctc),
        base: Number(form.base) || 0,
        bonus: Number(form.bonus) || 0,
        stockOptions: Number(form.stockOptions) || 0,
        joiningBonus: Number(form.joiningBonus) || 0,
      });
      toast.success('Salary contribution updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update salary entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Edit Salary Contribution"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} loading={loading}>Save</Button></>}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold">Role</label>
          <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold">CTC</label>
          <input className="input" type="number" value={form.ctc} onChange={(e) => set('ctc', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold">Year</label>
          <input className="input" type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs font-semibold">Base</label>
          <input className="input" type="number" value={form.base} onChange={(e) => set('base', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold">Bonus</label>
          <input className="input" type="number" value={form.bonus} onChange={(e) => set('bonus', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

const AlumniSalaryContributionsPage = () => {
  const [tab, setTab] = useState('mine');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await salaryService.getMine({ limit: 100 });
      setRows(res.data || []);
    } catch {
      toast.error('Failed to load your salary contributions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'mine') fetchMine();
  }, [tab]);

  const totals = useMemo(() => ({
    count: rows.length,
    companies: new Set(rows.map((r) => r.company?.name).filter(Boolean)).size,
  }), [rows]);

  const remove = async (id) => {
    try {
      await salaryService.remove(id);
      toast.success('Salary contribution removed');
      fetchMine();
    } catch {
      toast.error('Could not remove salary contribution');
    }
  };

  return (
    <div className="page-enter">
      <div className="max-w-[1360px] mx-auto overflow-x-hidden p-4 md:p-6 space-y-5">
        <div className="hero-shell hero-shell--alumni p-5">
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Salary Insights</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Your contributions are private to your account and editable anytime.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setTab('mine')} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto border ${tab === 'mine' ? 'bg-coral-500 text-white border-transparent shadow-[0_14px_32px_-24px_rgba(233,95,88,.9)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]'}`}>My Salary Contributions</button>
            <button onClick={() => setTab('insights')} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto border ${tab === 'insights' ? 'bg-coral-500 text-white border-transparent shadow-[0_14px_32px_-24px_rgba(233,95,88,.9)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]'}`}>Browse Salary Insights</button>
          </div>
        </div>

        {tab === 'insights' ? (
          <SalaryInsightsPage />
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="card p-4"><p className="text-xs text-[var(--color-text-muted)]">Contributions</p><p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{totals.count}</p></div>
              <div className="card p-4"><p className="text-xs text-[var(--color-text-muted)]">Companies</p><p className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{totals.companies}</p></div>
              <div className="card p-4"><p className="text-xs text-[var(--color-text-muted)]">Next Action</p><p className="text-sm font-semibold text-[var(--color-text-primary)]">Keep data fresh yearly</p></div>
            </div>

            {loading ? <div className="card p-8 text-sm text-[var(--color-text-muted)]">Loading your contributions...</div> : rows.length === 0 ? (
              <div className="card p-10 text-center">
                <DollarSign size={28} className="mx-auto text-[var(--color-text-muted)] mb-3" />
                <p className="font-semibold text-[var(--color-text-primary)]">Submit your first salary insight</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Your anonymized data helps juniors negotiate better.</p>
                <Button className="mt-4" leftIcon={<Plus size={14} />} onClick={() => setTab('insights')}>Open Salary Form</Button>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {rows.map((r) => (
                  <div key={r._id} className="card p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 hover-lift">
                    <Building2 size={16} className="text-[var(--color-text-muted)]" />
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--color-text-primary)]">{r.company?.name} - {r.role}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{r.year} · CTC {r.ctc} LPA</p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]" onClick={() => setEditing(r)}><Pencil size={14} /></button>
                    <button className="p-2 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--danger)] transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:text-[#fca5a5] dark:hover:bg-[rgba(239,68,68,0.16)]" onClick={() => remove(r._id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <EditSalaryModal open={Boolean(editing)} row={editing} onClose={() => setEditing(null)} onSaved={fetchMine} />
    </div>
  );
};

export default AlumniSalaryContributionsPage;
