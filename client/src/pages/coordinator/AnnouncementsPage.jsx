import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, CalendarClock, CheckCircle2, Copy, Eye, History, Megaphone, RefreshCw, Send, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import Button from '../../components/ui/Button';

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
];
const BATCHES = ['2024', '2025', '2026', '2027', '2028'];

const TARGET_OPTIONS = [
  { id: 'all', label: 'All Students' },
  { id: 'branch', label: 'Single Branch' },
  { id: 'batch', label: 'Single Batch' },
  { id: 'branch_batch', label: 'Branch + Batch' },
];

const STATUS_OPTIONS = ['', 'draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'];
const TARGET_FILTERS = ['', 'all', 'branch', 'batch', 'branch_batch'];

const initialForm = {
  title: '',
  message: '',
  format: 'plain',
  target: 'all',
  branch: '',
  batch: '',
  templateKey: '',
  sendMode: 'now',
  scheduledFor: '',
};

const AnnouncementsPage = () => {
  const [tab, setTab] = useState('compose');
  const [form, setForm] = useState(initialForm);
  const [templates, setTemplates] = useState([]);
  const [audienceCount, setAudienceCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({
    search: '',
    status: '',
    targetType: '',
    page: 1,
    limit: 10,
  });
  const [historyPagination, setHistoryPagination] = useState({ page: 1, pages: 1, total: 0 });
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const canPreview = useMemo(() => {
    if (form.target === 'branch') return !!form.branch;
    if (form.target === 'batch') return !!form.batch;
    if (form.target === 'branch_batch') return !!form.branch && !!form.batch;
    return true;
  }, [form.target, form.branch, form.batch]);

  const fetchTemplates = async () => {
    try {
      const res = await notificationService.getTemplates();
      setTemplates(Array.isArray(res.data?.templates) ? res.data.templates : []);
    } catch {
      setTemplates([]);
    }
  };

  const fetchHistory = async (overrides = {}) => {
    const next = { ...historyFilter, ...overrides };
    setHistoryLoading(true);
    try {
      const res = await notificationService.getHistory(next);
      setHistory(Array.isArray(res.data) ? res.data : []);
      setHistoryPagination(res.pagination || res.data?.pagination || { page: 1, pages: 1, total: 0 });
      setHistoryFilter(next);
    } catch {
      toast.error('Failed to load announcement history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const applyTemplate = (key) => {
    const template = safeTemplates.find((t) => t.key === key);
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      templateKey: key,
      title: template.title,
      message: template.message,
    }));
  };

  const previewAudience = async () => {
    if (!canPreview) {
      toast.error('Select branch/batch first for this audience type');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await notificationService.previewAudience({
        target: form.target,
        branch: form.branch || undefined,
        batch: form.batch || undefined,
      });
      const count = Number(res.data?.count || 0);
      setAudienceCount(count);
      toast.success(`Audience: ${count} students`);
    } catch {
      toast.error('Failed to preview audience');
    } finally {
      setPreviewLoading(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.message.trim()) return 'Message is required';
    if (form.target === 'branch' && !form.branch) return 'Branch is required';
    if (form.target === 'batch' && !form.batch) return 'Batch is required';
    if (form.target === 'branch_batch' && (!form.branch || !form.batch)) {
      return 'Select branch and batch';
    }
    if (form.sendMode === 'later' && !form.scheduledFor) return 'Scheduled date-time is required';
    return '';
  };

  const sendAnnouncement = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSendLoading(true);
    try {
      const res = await notificationService.announce({
        title: form.title,
        message: form.message,
        format: form.format,
        target: form.target,
        branch: form.branch || undefined,
        batch: form.batch || undefined,
        templateKey: form.templateKey || undefined,
        sendMode: form.sendMode,
        scheduledFor: form.sendMode === 'later' ? form.scheduledFor : undefined,
      });

      toast.success(res.message || 'Announcement queued');
      setForm(initialForm);
      setAudienceCount(0);
      setTab('history');
      fetchHistory({ page: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setSendLoading(false);
    }
  };

  const duplicateToDraft = async (id) => {
    try {
      const res = await notificationService.cloneAnnouncement(id);
      const draft = res.data.draft;
      setForm({
        ...initialForm,
        title: draft.title || '',
        message: draft.message || '',
        format: draft.format || 'plain',
        target: draft.targetType || 'all',
        branch: draft.target?.branch || '',
        batch: draft.target?.batch || '',
        templateKey: draft.templateKey || '',
      });
      setTab('compose');
      toast.success('Draft opened in composer');
    } catch {
      toast.error('Could not duplicate this announcement');
    }
  };

  const resendNow = async (row) => {
    try {
      await notificationService.announce({
        title: row.title,
        message: row.message,
        format: row.format,
        target: row.targetType,
        branch: row.target?.branch || undefined,
        batch: row.target?.batch || undefined,
        templateKey: row.templateKey || undefined,
        sendMode: 'now',
      });
      toast.success('Announcement resent');
      fetchHistory();
    } catch {
      toast.error('Failed to resend announcement');
    }
  };

  const fillAsNewDraft = (row) => {
    setForm({
      ...initialForm,
      title: row.title || '',
      message: row.message || '',
      format: row.format || 'plain',
      target: row.targetType || 'all',
      branch: row.target?.branch || '',
      batch: row.target?.batch || '',
      templateKey: row.templateKey || '',
    });
    setTab('compose');
  };

  return (
    <div className="page-enter p-4 md:p-6 lg:p-8 space-y-6 max-w-[1360px] mx-auto overflow-x-hidden">
      <section className="hero-shell hero-shell--coordinator px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Send now, schedule later, and reuse past announcements with full history.
            </p>
          </div>

          <div className="inline-flex rounded-input border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              onClick={() => setTab('compose')}
              className={`px-3 py-1.5 rounded-input text-sm font-semibold ${tab === 'compose' ? 'bg-[var(--accent)] text-[var(--text-reverse)]' : 'text-[var(--text-secondary)]'}`}
            >
              <span className="inline-flex items-center gap-1.5"><Megaphone size={14} /> Compose</span>
            </button>
            <button
              onClick={() => setTab('history')}
              className={`px-3 py-1.5 rounded-input text-sm font-semibold ${tab === 'history' ? 'bg-[var(--accent)] text-[var(--text-reverse)]' : 'text-[var(--text-secondary)]'}`}
            >
              <span className="inline-flex items-center gap-1.5"><History size={14} /> History</span>
            </button>
          </div>
        </div>
      </section>

      {tab === 'compose' && (
        <div className="card p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Template</label>
              <select
                value={form.templateKey}
                onChange={(e) => applyTemplate(e.target.value)}
                className="input text-sm"
              >
                <option value="">Custom message</option>
                {safeTemplates.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Formatting</label>
              <select value={form.format} onChange={(e) => setField('format', e.target.value)} className="input text-sm">
                <option value="plain">Plain text</option>
                <option value="markdown">Simple rich format (Markdown)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Target Audience</label>
              <select value={form.target} onChange={(e) => setField('target', e.target.value)} className="input text-sm">
                {TARGET_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={previewAudience}
                disabled={!canPreview}
                loading={previewLoading}
                leftIcon={<Eye size={14} />}
                className="w-full md:w-auto"
              >
                Preview Audience
              </Button>
              <span className="ml-3 text-sm text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                <Users size={14} className="text-[var(--accent)]" />
                {audienceCount} students
              </span>
            </div>
          </div>

          {(form.target === 'branch' || form.target === 'branch_batch') && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Branch</label>
              <select value={form.branch} onChange={(e) => setField('branch', e.target.value)} className="input text-sm">
                <option value="">Select branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {(form.target === 'batch' || form.target === 'branch_batch') && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Batch</label>
              <select value={form.batch} onChange={(e) => setField('batch', e.target.value)} className="input text-sm">
                <option value="">Select batch</option>
                {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              maxLength={140}
              placeholder="Announcement headline"
              className="input text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              rows={7}
              maxLength={3000}
              placeholder="Use markdown for bold, bullets, and links when formatting is set to markdown."
              className="input text-sm min-h-40"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Send Mode</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setField('sendMode', 'now')}
                  className={`px-3 py-2 rounded-input border text-sm font-semibold ${form.sendMode === 'now' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  Send now
                </button>
                <button
                  onClick={() => setField('sendMode', 'later')}
                  className={`px-3 py-2 rounded-input border text-sm font-semibold ${form.sendMode === 'later' ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  Send later
                </button>
              </div>
            </div>
            {form.sendMode === 'later' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Schedule Time</label>
                <div className="relative">
                  <CalendarClock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="datetime-local"
                    value={form.scheduledFor}
                    onChange={(e) => setField('scheduledFor', e.target.value)}
                    className="input text-sm pl-9"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="ghost" onClick={() => setForm(initialForm)}>Reset</Button>
            <Button onClick={sendAnnouncement} loading={sendLoading} leftIcon={<Send size={14} />}>
              {form.sendMode === 'later' ? 'Schedule Announcement' : 'Send Announcement'}
            </Button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={historyFilter.search}
              onChange={(e) => setHistoryFilter((p) => ({ ...p, search: e.target.value }))}
              placeholder="Search title/message"
              className="input text-sm"
            />
            <select
              value={historyFilter.status}
              onChange={(e) => setHistoryFilter((p) => ({ ...p, status: e.target.value }))}
              className="input text-sm"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
            <select
              value={historyFilter.targetType}
              onChange={(e) => setHistoryFilter((p) => ({ ...p, targetType: e.target.value }))}
              className="input text-sm"
            >
              {TARGET_FILTERS.map((t) => <option key={t} value={t}>{t || 'All Audiences'}</option>)}
            </select>
            <Button variant="ghost" onClick={() => fetchHistory({ page: 1 })} leftIcon={<RefreshCw size={14} />}>
              Apply Filters
            </Button>
          </div>

          {historyLoading ? (
            <div className="py-14 text-center text-sm text-[var(--text-muted)]">Loading announcement history...</div>
          ) : safeHistory.length === 0 ? (
            <div className="py-14 text-center">
              <Bell size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">No announcements found for selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ht-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Audience</th>
                    <th>Sent / Target</th>
                    <th>Status</th>
                    <th>Sent Time</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeHistory.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{row.title}</p>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">{row.message}</p>
                      </td>
                      <td className="text-sm text-[var(--text-secondary)]">
                        {row.targetType}
                        {row.target?.branch ? ` / ${row.target.branch}` : ''}
                        {row.target?.batch ? ` / ${row.target.batch}` : ''}
                      </td>
                      <td className="text-sm text-[var(--text-secondary)]">{row.sentCount || 0} / {row.targetCount || 0}</td>
                      <td>
                        <span className="chip text-xs">
                          {row.deliveryStatus === 'delivered' ? <CheckCircle2 size={12} /> : <Bell size={12} />} {row.status}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--text-secondary)]">
                        {row.sentAt ? new Date(row.sentAt).toLocaleString('en-IN') : row.scheduledFor ? `Scheduled: ${new Date(row.scheduledFor).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn-ghost h-8 px-2.5 text-xs" onClick={() => duplicateToDraft(row._id)}>
                            <Copy size={12} className="mr-1" /> Duplicate
                          </button>
                          <button className="btn-ghost h-8 px-2.5 text-xs" onClick={() => fillAsNewDraft(row)}>
                            Edit as Draft
                          </button>
                          <button className="btn-secondary h-8 px-2.5 text-xs" onClick={() => resendNow(row)}>
                            <Send size={12} className="mr-1" /> Resend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {historyPagination.pages > 1 && (
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistory({ page: Math.max(1, historyPagination.page - 1) })}
                disabled={historyPagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-[var(--text-muted)] self-center">
                Page {historyPagination.page} / {historyPagination.pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistory({ page: Math.min(historyPagination.pages, historyPagination.page + 1) })}
                disabled={historyPagination.page >= historyPagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
