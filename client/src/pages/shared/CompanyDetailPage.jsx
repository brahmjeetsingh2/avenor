import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Globe, MapPin, IndianRupee, Users, FileText,
  Calendar, ChevronDown, ChevronUp, Edit, Trash2, ExternalLink,
  CheckCircle, Clock, Building2, BrainCircuit, Bookmark, BookmarkCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import applicationService from '../../services/applicationService';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import StagePipeline, { STAGES, getStage } from '../../components/shared/StagePipeline';
import Countdown from '../../components/shared/Countdown';
import { CompanyDetailSkeleton } from '../../components/shared/Skeleton';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import UpdateStageModal from './UpdateStageModal';

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, accent = false }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}
      className="last-info-row">
      <span style={{ width: 30, height: 30, borderRadius: 10, background: accent ? 'rgba(17,17,17,0.10)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
        <Icon size={14} style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)' }} />
      </span>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
};

// ─── Timeline entry ───────────────────────────────────────────────────────────
const TimelineEntry = ({ entry, isLast }) => {
  const stage = getStage(entry.stage);
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
      {/* Connector column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: stage.bg, border: `2px solid ${stage.border || 'var(--border)'}`,
          flexShrink: 0,
        }}>
          <CheckCircle size={13} style={{ color: stage.color }} />
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '12px 14px',
        marginBottom: isLast ? 0 : 14,
        borderRadius: 14,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, textTransform: 'capitalize', color: stage.color }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color }} />
            {entry.stage}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {entry.description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{entry.description}</p>
        )}
        {entry.updatedBy?.name && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>by {entry.updatedBy.name}</p>
        )}
      </div>
    </div>
  );
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background:   'linear-gradient(160deg, color-mix(in srgb, var(--surface) 96%, #FFFFFF 4%) 0%, color-mix(in srgb, var(--surface-2) 94%, #FFFFFF 6%) 100%)',
    border:       '1px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    boxShadow:    'var(--shadow-soft)',
    ...style,
  }}>
    {children}
  </div>
);

// ─── Card heading ─────────────────────────────────────────────────────────────
const CardHeading = ({ icon: Icon, iconBg, iconColor, children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
    <h2 style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
      {Icon && (
        <span style={{ width: 30, height: 30, borderRadius: 10, background: iconBg || 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
          <Icon size={14} style={{ color: iconColor || 'var(--text-muted)' }} />
        </span>
      )}
      {children}
    </h2>
    {action}
  </div>
);

// ─── Icon action button ───────────────────────────────────────────────────────
const IconBtn = ({ onClick, title, danger, as: Tag = 'button', to, children }) => {
  const style = {
    width: 36, height: 36, borderRadius: 10,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', textDecoration: 'none',
    transition: 'color 0.15s ease, border-color 0.15s ease, background 0.15s ease',
    flexShrink: 0,
  };
  const hoverIn  = (e) => {
    if (danger) {
      e.currentTarget.style.color       = 'var(--danger)';
      e.currentTarget.style.borderColor = 'rgba(255,69,58,0.3)';
      e.currentTarget.style.background  = 'rgba(255,69,58,0.08)';
    } else {
      e.currentTarget.style.color       = 'var(--text-primary)';
      e.currentTarget.style.borderColor = 'rgba(17,17,17,0.26)';
    }
  };
  const hoverOut = (e) => {
    e.currentTarget.style.color       = 'var(--text-muted)';
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.background  = 'transparent';
  };

  if (Tag === Link) {
    return <Link to={to} style={style} title={title} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</Link>;
  }
  return <button onClick={onClick} style={style} title={title} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</button>;
};

// ─── Main component ───────────────────────────────────────────────────────────
const CompanyDetailPage = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user, updateUser }      = useAuth();
  const isCoordinator = user?.role === 'coordinator';
  const isStudent = user?.role === 'student';

  const [company,          setCompany]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [applying,         setApplying]         = useState(false);
  const [stageModalOpen,   setStageModalOpen]   = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  const savedCompanyIds = new Set((user?.savedCompanies || []).map(String));
  const isSaved = savedCompanyIds.has(String(company?._id));

  const fetchCompany = async () => {
    try {
      const res = await companyService.getById(id);
      setCompany(res.data.company);
    } catch {
      toast.error('Company not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${company.name} from active companies?`)) return;
    try {
      await companyService.remove(id);
      toast.success('Company removed');
      navigate('/coordinator/companies');
    } catch { toast.error('Failed to remove company'); }
  };

  const handleStageUpdated = (updatedCompany) => {
    setCompany(updatedCompany);
    setStageModalOpen(false);
    toast.success(`Stage updated to ${updatedCompany.currentStage}`);
  };

  const toggleBookmark = async () => {
    if (!company?._id || savingBookmark) return;
    setSavingBookmark(true);
    try {
      const res = await authService.toggleSavedCompany(company._id);
      if (Array.isArray(res.data?.savedCompanyIds)) {
        updateUser({ savedCompanies: res.data.savedCompanyIds });
      }
      toast.success(res.message || (res.data?.saved ? 'Company saved' : 'Company removed from saved list'));
    } catch {
      toast.error('Could not update saved companies');
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleApply = async () => {
    if (!company?._id || applying) return;
    if (hasDeadlinePassed) {
      toast.error('Application deadline has passed');
      return;
    }

    setApplying(true);
    try {
      await applicationService.apply(company._id);
      navigate('/student/applications', {
        state: {
          applyToast: 'Application submitted!',
          applyToastType: 'success',
          appliedCompanyId: company._id,
        },
      });
    } catch (err) {
      if (err.response?.status === 409) {
        navigate('/student/applications', {
          state: {
            applyToast: 'You have already applied to this company',
            applyToastType: 'error',
            appliedCompanyId: company._id,
          },
        });
        return;
      }

      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}>
      <CompanyDetailSkeleton />
    </div>
  );
  if (!company) return null;

  const stage = getStage(company.currentStage);
  const hasDeadlinePassed = Boolean(company.applicationDeadline)
    && new Date(company.applicationDeadline).getTime() <= Date.now();
  const heroDeadlineLabel = company.applicationDeadline
    ? new Date(company.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No deadline set';

  const formatCTC = (ctc) => {
    if (!ctc?.min && !ctc?.max) return 'Not disclosed';
    if (ctc.min === ctc.max)    return `₹${ctc.max} LPA`;
    return `₹${ctc.min} – ${ctc.max} LPA`;
  };

  return (
    <div
      className="page-enter"
      style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(16px,4vw,26px)', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {/* ── Back ───────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease', alignSelf: 'flex-start' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={15} /> Back to companies
      </button>

      {/* ── Hero card ──────────────────────────────────────────────── */}
      <Card style={{ padding: 'clamp(18px,3vw,28px)' }}>
        <div className="hero-shell hero-shell--student" style={{ borderRadius: 'inherit', padding: 'clamp(18px,2.8vw,24px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]" style={{ gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'flex', gap: 18, minWidth: 0 }}>
              <CompanyLogo logo={company.logo} name={company.name} size="lg" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                    Company details
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 'var(--radius-pill)', border: `1px solid ${stage.border || 'var(--border)'}`, background: stage.bg, color: stage.color, fontSize: 11, fontWeight: 800 }}>
                    {stage.label}
                  </span>
                </div>

                <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 10 }}>
                  {company.name}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>{company.sector}</span>
                  <span style={{ color: 'var(--border)' }}>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{company.type}</span>
                  {company.location && (
                    <>
                      <span style={{ color: 'var(--border)' }}>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {company.location}
                      </span>
                    </>
                  )}
                  {company.websiteUrl && (
                    <>
                      <span style={{ color: 'var(--border)' }}>•</span>
                      <a
                        href={company.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Globe size={11} /> Website <ExternalLink size={10} />
                      </a>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                  {company.applicationDeadline && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(17,17,17,0.10)', border: '1px solid rgba(17,17,17,0.16)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>
                      <Calendar size={12} /> Deadline {heroDeadlineLabel}
                    </span>
                  )}
                  {company.applicationDeadline && <Countdown deadline={company.applicationDeadline} />}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
              {(isCoordinator || isStudent) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  {isStudent && (
                    <button
                      onClick={toggleBookmark}
                      disabled={savingBookmark}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 14px', borderRadius: 'var(--radius-input)',
                        background: isSaved ? 'rgba(17,17,17,0.10)' : 'rgba(255,255,255,0.30)',
                        color: isSaved ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer',
                        transition: 'background 0.18s ease, transform 0.18s ease, border-color 0.18s ease',
                        opacity: savingBookmark ? 0.7 : 1,
                      }}
                    >
                      {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  )}
                  {isCoordinator && (
                    <>
                      <button
                        onClick={() => setStageModalOpen(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '9px 14px', borderRadius: 'var(--radius-input)',
                          background: 'var(--accent)', color: 'var(--text-reverse)',
                          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                          transition: 'background 0.18s ease, transform 0.18s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        Update Stage
                      </button>
                      <IconBtn as={Link} to={`/coordinator/companies/${id}/edit`} title="Edit"><Edit size={15} /></IconBtn>
                      <IconBtn onClick={handleDelete} title="Delete" danger><Trash2 size={15} /></IconBtn>
                    </>
                  )}
                </div>
              )}

              {isStudent && company.currentStage !== 'closed' && (
                <div style={{
                  background: 'rgba(17,17,17,0.08)',
                  border: '1px solid rgba(17,17,17,0.14)',
                  borderRadius: 'var(--radius-card)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-soft)'
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Interested?</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                    Apply now to track your progress through the entire recruitment pipeline.
                  </p>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying || hasDeadlinePassed}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      width: '100%', padding: '10px 0', borderRadius: 'var(--radius-input)',
                      background: (applying || hasDeadlinePassed) ? 'var(--accent-soft)' : 'var(--accent)', color: 'var(--text-reverse)',
                      fontWeight: 800, fontSize: 13, border: 'none', cursor: applying ? 'wait' : (hasDeadlinePassed ? 'not-allowed' : 'pointer'),
                      opacity: (applying || hasDeadlinePassed) ? 0.8 : 1,
                      boxShadow: (applying || hasDeadlinePassed) ? 'none' : 'var(--shadow-hover)',
                    }}
                    onMouseEnter={e => {
                      if (!applying && !hasDeadlinePassed) e.currentTarget.style.background = 'var(--accent-hover)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = (applying || hasDeadlinePassed) ? 'var(--accent-soft)' : 'var(--accent)';
                    }}
                  >
                    {applying ? 'Applying...' : (hasDeadlinePassed ? 'Deadline Passed' : 'Apply Now')}
                  </button>
                </div>
              )}

              {isStudent && company.currentStage === 'closed' && (
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '16px',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Applications closed</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    This company is no longer accepting applications.
                  </p>
                </div>
              )}
            </div>
          </div>

          {company.description && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {company.description}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Stage pipeline ─────────────────────────────────────────── */}
      <Card style={{ padding: '20px 22px' }}>
        <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(17,17,17,0.10) 0%, rgba(58,58,58,0.08) 100%)', border: '1px solid rgba(17,17,17,0.12)' }}>
          <CardHeading icon={Clock} iconBg="rgba(17,17,17,0.11)" iconColor="var(--accent)">
            Recruitment Pipeline
          </CardHeading>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: -6 }}>
            Track where this company is in the hiring journey and how close it is to the final decision.
          </p>
        </div>
        <div style={{ padding: '10px 4px 2px' }}>
          <StagePipeline currentStage={company.currentStage} />
        </div>
      </Card>

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]"
        style={{ gap: 18, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Open roles */}
          {company.roles?.length > 0 && (
            <Card style={{ padding: '20px 22px' }}>
              <CardHeading
                icon={Users}
                iconBg="rgba(17,17,17,0.09)"
                iconColor="var(--accent)"
                action={(
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', padding: '5px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    {company.roles.length} role{company.roles.length > 1 ? 's' : ''}
                  </span>
                )}
              >
                Open Roles
              </CardHeading>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14, lineHeight: 1.6 }}>
                These are the roles currently available for students to apply to under this company.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {company.roles.map(r => (
                  <span key={r} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700,
                    padding: '8px 12px', borderRadius: 'var(--radius-pill)',
                    background: 'linear-gradient(180deg, rgba(17,17,17,0.11) 0%, rgba(17,17,17,0.06) 100%)',
                    border: '1px solid rgba(17,17,17,0.16)',
                    color: 'var(--accent)',
                    boxShadow: '0 8px 18px -14px rgba(0,0,0,0.34)',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.8 }} />
                    {r}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Documents */}
          {company.documents?.length > 0 && (
            <Card style={{ padding: '20px 22px' }}>
              <CardHeading
                icon={FileText}
                iconBg="rgba(17,17,17,0.10)"
                iconColor="var(--accent)"
                action={(
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', padding: '5px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    {company.documents.length} file{company.documents.length > 1 ? 's' : ''}
                  </span>
                )}
              >
                Documents
              </CardHeading>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14, lineHeight: 1.6 }}>
                Official material and reference documents shared by the company.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {company.documents.map((doc, i) => (
                  <a
                    key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '12px 14px', borderRadius: 14,
                      border: '1px solid var(--border)', textDecoration: 'none',
                      background: 'linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)',
                      transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: 'var(--shadow-soft)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(17,17,17,0.26)'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(17,17,17,0.08) 0%, var(--surface) 100%)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(17,17,17,0.10)', border: '1px solid rgba(17,17,17,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={14} style={{ color: 'var(--accent)' }} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                        <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: 'var(--text-muted)' }}>Click to open document</span>
                      </div>
                    </div>
                    <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card style={{ padding: '20px 22px' }}>
            <CardHeading
              icon={Clock}
              iconBg="rgba(17,17,17,0.10)"
              iconColor="var(--accent)"
              action={company.timeline?.length > 3 && (
                <button
                  onClick={() => setTimelineExpanded(p => !p)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {timelineExpanded
                    ? <><ChevronUp size={13} /> Show less</>
                    : <><ChevronDown size={13} /> Show all ({company.timeline.length})</>
                  }
                </button>
              )}
            >
              Timeline History
            </CardHeading>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16, lineHeight: 1.6 }}>
              A chronological view of important updates, interviews, and stage changes for this company.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(timelineExpanded ? company.timeline : company.timeline?.slice(-3))
                ?.slice().reverse()
                .map((entry, i, arr) => (
                  <TimelineEntry key={entry._id} entry={entry} isLast={i === arr.length - 1} />
                ))}
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">

          {/* Key details */}
          <Card style={{ padding: '18px 20px' }}>
            <CardHeading>Key Details</CardHeading>
            <div>
              <InfoRow icon={IndianRupee} label="CTC Package" value={formatCTC(company.ctc)} accent />
              <InfoRow icon={Users} label="CGPA Cutoff" value={company.eligibility?.cgpa > 0 ? `${company.eligibility.cgpa}+` : null} />
              <InfoRow icon={FileText} label="Backlog Policy" value={company.eligibility?.backlogs !== undefined ? `${company.eligibility.backlogs} backlogs allowed` : null} />
              <InfoRow icon={Calendar} label="Application Deadline" value={company.applicationDeadline ? new Date(company.applicationDeadline).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : null} accent />
            </div>
          </Card>

          {/* Eligible branches */}
          {company.eligibility?.branches?.length > 0 && (
            <Card style={{ padding: '18px 20px' }}>
              <CardHeading>Eligible Branches</CardHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {company.eligibility.branches.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)', padding: '9px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <CheckCircle size={13} style={{ color: 'var(--status-success)', flexShrink: 0 }} /> {b}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Student CTA */}
          {user?.role === 'student' && (
            <Card style={{ padding: '18px 20px', background: 'linear-gradient(180deg, rgba(17,17,17,0.08) 0%, var(--surface) 100%)' }}>
              <CardHeading icon={BrainCircuit} iconBg="rgba(17,17,17,0.10)" iconColor="var(--accent)">
                Student Actions
              </CardHeading>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.65 }}>
                Use the prep tools to get ready for this company, and apply while the listing is open.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link
                  to={`/student/ai-prep?company=${company._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: '9px 0',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid rgba(17,17,17,0.26)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    transition: 'background 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(17,17,17,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <BrainCircuit size={13} /> AI Interview Prep
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Update stage modal ─────────────────────────────────────── */}
      {isCoordinator && (
        <UpdateStageModal
          isOpen={stageModalOpen}
          onClose={() => setStageModalOpen(false)}
          company={company}
          onUpdated={handleStageUpdated}
        />
      )}
    </div>
  );
};

export default CompanyDetailPage;
