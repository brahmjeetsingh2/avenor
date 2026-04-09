import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, ArrowRight, Building2, Bookmark, BookmarkCheck, Calendar } from 'lucide-react';
import Countdown from './Countdown';
import StagePipeline, { getStage } from './StagePipeline';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const CompanyLogo = ({ logo, name, size = 'md' }) => {
  const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-lg', lg: 'w-20 h-20 text-2xl' };
  if (logo) {
    return <img src={logo} alt={name} className={`${sizes[size]} rounded-xl object-contain border border-[var(--color-border)] bg-[var(--color-surface)] p-1`} />;
  }
  const initials = name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`${sizes[size]} rounded-xl bg-[var(--surface-2)] border border-[var(--color-border)] flex items-center justify-center font-display font-bold text-[var(--accent)]`}>
      {initials || <Building2 size={20} />}
    </div>
  );
};

export { CompanyLogo };

const typeLabels = { product: 'Product', service: 'Service', startup: 'Startup', psu: 'PSU', mnc: 'MNC' };

const CompanyCard = ({ company, onApply, showApply = true, view = 'grid' }) => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const stage = getStage(company.currentStage);
  const hasDeadlinePassed = Boolean(company.applicationDeadline)
    && new Date(company.applicationDeadline).getTime() <= Date.now();
  const isClosedForApply = company.currentStage === 'closed' || hasDeadlinePassed;
  const savedCompanyIds = useMemo(() => new Set((user?.savedCompanies || []).map(String)), [user?.savedCompanies]);
  const isSaved = savedCompanyIds.has(String(company._id));

  const formatCTC = (ctc) => {
    if (!ctc?.min && !ctc?.max) return 'CTC not disclosed';
    if (ctc.min === ctc.max) return `₹${ctc.max} LPA`;
    return `₹${ctc.min}–${ctc.max} LPA`;
  };

  const toggleSave = async () => {
    if (!company?._id || saving) return;

    setSaving(true);
    try {
      const res = await authService.toggleSavedCompany(company._id);
      if (Array.isArray(res.data?.savedCompanyIds)) {
        updateUser({ savedCompanies: res.data.savedCompanyIds });
      }
      toast.success(res.message || (res.data?.saved ? 'Company saved' : 'Company removed from saved list'));
    } catch {
      toast.error('Could not update saved companies');
    } finally {
      setSaving(false);
    }
  };

  if (view === 'list') {
    return (
      <div className="card card-interactive px-4 py-4 md:px-5 md:py-4 reveal-up-sm border-b border-[var(--color-border)] first:rounded-t-2xl last:rounded-b-2xl rounded-none hover:border-[var(--accent)]/25 hover:shadow-[var(--shadow-hover)] transition-all">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(220px,0.85fr)_auto] xl:items-center gap-3 xl:gap-5">
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo logo={company.logo} name={company.name} />
            <div className="min-w-0 pt-0.5">
              <h3 className="font-display font-bold text-[var(--color-text-primary)] text-[14.5px] leading-tight truncate">
                {company.name}
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1 truncate">
                {typeLabels[company.type]} · {company.sector}
              </p>
              {company.roles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {company.roles.slice(0, 2).map((role) => (
                    <span key={role} className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] shadow-sm">
                      {role}
                    </span>
                  ))}
                  {company.roles.length > 2 && (
                    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm">
                      +{company.roles.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="xl:px-2 xl:border-l xl:border-[var(--color-border)] xl:pl-5">
            <StagePipeline currentStage={company.currentStage} compact />
          </div>

          <div className="flex flex-col gap-2 md:min-w-[220px] xl:border-l xl:border-[var(--color-border)] xl:pl-5">
            <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--color-text-muted)] bg-[var(--surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1 font-bold text-[var(--color-text-secondary)]">
                <IndianRupee size={12} className="text-[var(--accent)]" />
                {formatCTC(company.ctc)}
              </div>
              {company.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={11} /> {company.location}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 min-h-[18px]">
              <Countdown deadline={company.applicationDeadline} className="min-h-[18px]" />
              <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${stage.bg} ${stage.border} ${stage.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {stage.label}
              </span>
            </div>
          </div>

          <div className="flex flex-row xl:flex-col xl:items-end items-center justify-between xl:justify-center gap-2 md:min-w-[220px] xl:border-l xl:border-[var(--color-border)] xl:pl-5">
            {user?.role === 'student' && (
              <button
                type="button"
                onClick={toggleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--accent)] transition-colors disabled:opacity-60 hover:shadow-[var(--shadow-soft)]"
              >
                {isSaved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <Link
                to={`/companies/${company._id}`}
                className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
              >
                Details <ArrowRight size={11} />
              </Link>
              {showApply && (
                <button
                  type="button"
                  onClick={() => onApply?.(company)}
                  disabled={isClosedForApply}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isClosedForApply ? 'bg-[var(--surface-3)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed opacity-80' : 'bg-[var(--accent)] text-[var(--text-reverse)] hover:bg-[var(--accent-hover)] shadow-md hover:shadow-[var(--shadow-hover)]'}`}
                >
                  {company.currentStage === 'closed' ? 'Closed' : (hasDeadlinePassed ? 'Deadline Passed' : 'Apply Now')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-interactive p-5 flex flex-col gap-4 group reveal-up-sm transition-all hover:border-[var(--accent)]/25 hover:shadow-[var(--shadow-hover)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <CompanyLogo logo={company.logo} name={company.name} />
          <div className="min-w-0">
            <h3 className="font-display font-bold text-[var(--color-text-primary)] text-base leading-tight group-hover:text-[var(--accent)] transition-colors truncate">
              {company.name}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
              {typeLabels[company.type]} · {company.sector}
            </p>
            {company.applicationDeadline && (
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
                <Calendar size={11} />
                {new Date(company.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'student' && (
            <button
              type="button"
              onClick={toggleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--accent)] transition-colors disabled:opacity-60"
            >
              {isSaved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}

          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${stage.bg} ${stage.border} ${stage.color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {stage.label}
          </span>
        </div>
      </div>

      <div className="px-1 -mt-1">
        <StagePipeline currentStage={company.currentStage} compact />
      </div>

      {company.roles?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {company.roles.slice(0, 3).map((role) => (
            <span key={role} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] shadow-sm">
              {role}
            </span>
          ))}
          {company.roles.length > 3 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm">
              +{company.roles.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] bg-[var(--surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2">
        <div className="flex items-center gap-1 font-bold text-[var(--color-text-secondary)]">
          <IndianRupee size={12} className="text-[var(--accent)]" />
          {formatCTC(company.ctc)}
        </div>
        {company.location && (
          <div className="flex items-center gap-1">
            <MapPin size={11} /> {company.location}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 pt-1 border-t border-[var(--color-border)]">
        <Countdown deadline={company.applicationDeadline} className="min-h-[18px]" />
        <div className="flex items-center gap-2">
          <Link
            to={`/companies/${company._id}`}
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
          >
            Details <ArrowRight size={11} />
          </Link>
          {showApply && (
            <button
              type="button"
              onClick={() => onApply?.(company)}
              disabled={isClosedForApply}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isClosedForApply ? 'bg-[var(--surface-3)] text-[var(--text-disabled)] border border-[var(--border)] cursor-not-allowed opacity-80' : 'bg-[var(--accent)] text-[var(--text-reverse)] hover:bg-[var(--accent-hover)] shadow-md hover:shadow-[var(--shadow-hover)]'}`}
            >
              {company.currentStage === 'closed' ? 'Closed' : (hasDeadlinePassed ? 'Deadline Passed' : 'Apply Now')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
