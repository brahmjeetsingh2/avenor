import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, ChevronDown, ChevronUp, Eye, Filter, RefreshCw, Save,
  Search, StickyNote, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import applicationService from '../../services/applicationService';
import { StatusBadge, ALL_STATUSES } from '../../utils/applicationStatus';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const SAVED_VIEWS = [
  {
    key: 'shortlisted_no_slot',
    label: 'Shortlisted but no slot',
    filters: { statusGroup: 'shortlisted_pipeline', slotAssigned: 'unassigned' },
  },
  {
    key: 'test_cleared',
    label: 'Test cleared',
    filters: { statusGroup: 'test_cleared' },
  },
  {
    key: 'offers_pending',
    label: 'Offers pending',
    filters: { statusGroup: 'offer_pending' },
  },
];

const SORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'batch', label: 'Batch' },
  { key: 'branch', label: 'Branch' },
  { key: 'appliedDate', label: 'Applied Date' },
  { key: 'currentStatus', label: 'Current Status' },
];

const CoordinatorShortlistPage = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    batch: '',
    statusGroup: '',
    status: '',
    slotAssigned: '',
  });

  const [sort, setSort] = useState({ sortBy: 'appliedDate', order: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [detailApp, setDetailApp] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [pageError, setPageError] = useState('');

  const selectedCount = selectedIds.size;
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  useEffect(() => {
    companyService.getAll({ limit: 200, active: 'all' })
      .then((res) => {
        const payload = res?.data?.data ?? res?.data ?? [];
        setCompanies(Array.isArray(payload) ? payload : []);
      })
      .catch(() => setCompanies([]));
  }, []);

  const fetchApplications = async (overrides = {}) => {
    if (!selectedCompany) return;

    const nextPage = overrides.page || pagination.page;
    setLoading(true);
    setPageError('');

    try {
      const res = await applicationService.getByCompany(selectedCompany, {
        page: nextPage,
        limit: pagination.limit,
        ...filters,
        ...sort,
      });

      const payload = res?.data?.data ?? res?.data ?? [];
      setRows(Array.isArray(payload) ? payload : []);
      setPagination(res?.pagination || res?.data?.pagination || { page: 1, pages: 1, total: 0, limit: 50 });
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Failed to load shortlist data');
      setPageError(err?.response?.data?.message || 'Failed to load shortlist data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const applyFilters = () => fetchApplications({ page: 1 });

  const applySavedView = (key) => {
    const view = SAVED_VIEWS.find((v) => v.key === key);
    if (!view) return;
    setFilters((prev) => ({ ...prev, ...view.filters }));
    setTimeout(() => fetchApplications({ page: 1 }), 0);
  };

  const toggleSort = (field) => {
    setSort((prev) => ({
      sortBy: field,
      order: prev.sortBy === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
    setTimeout(() => fetchApplications({ page: 1 }), 0);
  };

  const allChecked = useMemo(() => safeRows.length > 0 && selectedIds.size === safeRows.length, [safeRows, selectedIds]);

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(safeRows.map((r) => r._id)));
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkStatusUpdate = async (status) => {
    if (!selectedIds.size) return;

    try {
      await applicationService.bulkStatus({ applicationIds: [...selectedIds], status });
      toast.success(`Updated ${selectedIds.size} records to ${status}`);
      fetchApplications();
    } catch {
      toast.error('Bulk status update failed');
    }
  };

  const openDetails = (app) => {
    setDetailApp(app);
    setNotesDraft(app.coordinatorNotes || '');
  };

  const saveNotes = async () => {
    if (!detailApp) return;

    setSavingNotes(true);
    try {
      await applicationService.updateNotes(detailApp._id, { coordinatorNotes: notesDraft });
      toast.success('Coordinator notes updated');
      setDetailApp((prev) => ({ ...prev, coordinatorNotes: notesDraft }));
      setRows((prev) => prev.map((r) => (r._id === detailApp._id ? { ...r, coordinatorNotes: notesDraft } : r)));
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const updateSingleStatus = async (id, status) => {
    try {
      await applicationService.updateStatus(id, { status });
      toast.success('Status updated');
      fetchApplications();
    } catch {
      toast.error('Could not update status');
    }
  };

  return (
    <div className="page-enter p-4 md:p-6 lg:p-8 space-y-6 max-w-[1360px] mx-auto overflow-x-hidden">
      <section className="hero-shell hero-shell--coordinator px-5 py-4">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Shortlists</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
          Advanced shortlist management with saved views, sorting, row actions, and pagination.
        </p>
      </section>

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setFilters({ search: '', branch: '', batch: '', statusGroup: '', status: '', slotAssigned: '' });
              setSort({ sortBy: 'appliedDate', order: 'desc' });
            }}
            className="input text-sm"
          >
            <option value="">Select company</option>
            {safeCompanies.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <input
            className="input text-sm"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Search name/email/branch"
          />

          <input
            className="input text-sm"
            value={filters.branch}
            onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}
            placeholder="Branch"
          />

          <input
            className="input text-sm"
            value={filters.batch}
            onChange={(e) => setFilters((p) => ({ ...p, batch: e.target.value }))}
            placeholder="Batch"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.statusGroup}
            onChange={(e) => setFilters((p) => ({ ...p, statusGroup: e.target.value, status: '' }))}
            className="input text-sm"
          >
            <option value="">Status group</option>
            <option value="active">Active pipeline</option>
            <option value="shortlisted_pipeline">Shortlisted pipeline</option>
            <option value="test_cleared">Test cleared</option>
            <option value="offer_pending">Offers pending</option>
            <option value="final">Final outcomes</option>
            <option value="offer">Offers only</option>
            <option value="rejected">Rejected only</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, statusGroup: '' }))}
            className="input text-sm"
          >
            <option value="">Specific status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filters.slotAssigned}
            onChange={(e) => setFilters((p) => ({ ...p, slotAssigned: e.target.value }))}
            className="input text-sm"
          >
            <option value="">Interview slot state</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>

          <select className="input text-sm" onChange={(e) => applySavedView(e.target.value)} defaultValue="">
            <option value="">Saved view</option>
            {SAVED_VIEWS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={applyFilters} leftIcon={<Filter size={14} />}>Apply Filters</Button>
          <Button variant="ghost" onClick={() => fetchApplications({ page: 1 })} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">{pagination.total} records</span>
            <Button variant="ghost" size="sm" disabled={!selectedCount} onClick={() => bulkStatusUpdate('shortlisted')}>
              Shortlist Selected
            </Button>
            <Button variant="ghost" size="sm" disabled={!selectedCount} onClick={() => bulkStatusUpdate('offer')}>
              Mark Offer
            </Button>
          </div>
        </div>
      </div>

      {!selectedCompany ? (
        <div className="card p-10 text-center text-[var(--text-muted)]">
          Select a company to begin shortlist operations.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-[var(--text-muted)]">Loading shortlist data...</div>
          ) : pageError ? (
            <div className="p-10 text-center text-sm text-[var(--danger)]">
              {pageError}
            </div>
          ) : safeRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--text-muted)]">No applicants match the current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ht-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                    </th>
                    <th>
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                        Name {sort.sortBy === 'name' ? (sort.order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                      </button>
                    </th>
                    <th>
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort('branch')}>
                        Branch {sort.sortBy === 'branch' ? (sort.order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                      </button>
                    </th>
                    <th>
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort('batch')}>
                        Batch {sort.sortBy === 'batch' ? (sort.order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                      </button>
                    </th>
                    <th>
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort('currentStatus')}>
                        Current Status {sort.sortBy === 'currentStatus' ? (sort.order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                      </button>
                    </th>
                    <th>
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort('appliedDate')}>
                        Applied Date {sort.sortBy === 'appliedDate' ? (sort.order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                      </button>
                    </th>
                    <th>Interview Slot</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {safeRows.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row._id)}
                          onChange={() => toggleRow(row._id)}
                        />
                      </td>
                      <td>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{row.student?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{row.student?.email}</p>
                      </td>
                      <td className="text-sm text-[var(--text-secondary)]">{row.student?.branch || '-'}</td>
                      <td className="text-sm text-[var(--text-secondary)]">{row.student?.batch || '-'}</td>
                      <td><StatusBadge status={row.status} /></td>
                      <td className="text-sm text-[var(--text-secondary)]">{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        {row.interviewSlot?.date
                          ? `${new Date(row.interviewSlot.date).toLocaleDateString('en-IN')} ${row.interviewSlot.time || ''}`
                          : <span className="text-[var(--text-muted)] text-sm">Unassigned</span>}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <select
                            className="input h-8 text-xs"
                            value=""
                            onChange={(e) => e.target.value && updateSingleStatus(row._id, e.target.value)}
                          >
                            <option value="">Update</option>
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="btn-ghost h-8 px-2.5 text-xs" onClick={() => openDetails(row)}>
                            <Eye size={12} className="mr-1" /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[var(--border)] px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)]">
              Showing page {pagination.page} of {pagination.pages} • {selectedCount} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchApplications({ page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchApplications({ page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!detailApp}
        onClose={() => setDetailApp(null)}
        title="Applicant Detail"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setDetailApp(null)}>Close</Button>
            <Button loading={savingNotes} onClick={saveNotes} leftIcon={<Save size={14} />}>
              Save Notes
            </Button>
          </div>
        }
      >
        {detailApp && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--text-muted)]">Student</p>
                <p className="font-semibold text-[var(--text-primary)]">{detailApp.student?.name}</p>
                <p className="text-[var(--text-secondary)]">{detailApp.student?.email}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Current Status</p>
                <StatusBadge status={detailApp.status} />
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Branch / Batch</p>
                <p className="text-[var(--text-secondary)]">{detailApp.student?.branch || '-'} / {detailApp.student?.batch || '-'}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Interview Slot</p>
                <p className="text-[var(--text-secondary)]">
                  {detailApp.interviewSlot?.date
                    ? `${new Date(detailApp.interviewSlot.date).toLocaleDateString('en-IN')} ${detailApp.interviewSlot.time || ''}`
                    : 'Not assigned'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Coordinator Notes
              </label>
              <textarea
                className="input min-h-28 text-sm"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add context for this applicant, blockers, or next steps..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CoordinatorShortlistPage;
