import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, Share2, Trash2, User,
  ChevronDown, ChevronUp, MessageSquare, Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';
import experienceService from '../../services/experienceService';
import useAuth from '../../hooks/useAuth';
import { timeAgo, DifficultyStars, VerdictBadge, RoundTag, ROUND_CFG } from '../../utils/experienceHelpers';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import { CompanyDetailSkeleton } from '../../components/shared/Skeleton';

// ─── Round section ────────────────────────────────────────────────────────────
const RoundSection = ({ round, index }) => {
  const [open, setOpen] = useState(true);
  const cfg = ROUND_CFG[round.type] || {};

  return (
    <div
      style={{
        background:   'var(--surface)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
        boxShadow:    'var(--shadow-soft)',
        transition:   'box-shadow 0.2s ease',
      }}
    >
      {/* Accordion toggle */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 18px',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          transition:     'background 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Round number badge */}
          <span
            style={{
              width:          28, height: 28,
              borderRadius:   8,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       11,
              fontWeight:     700,
              background:     cfg.bg   || 'var(--surface-2)',
              color:          cfg.color || 'var(--text-muted)',
              flexShrink:     0,
            }}
          >
            {index + 1}
          </span>
          <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoundTag type={round.type} />
            {round.duration && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {round.duration}</span>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp   size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        }
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Questions */}
          {round.questions?.length > 0 && (
            <div style={{ paddingTop: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Questions Asked ({round.questions.length})
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {round.questions.map((q, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <span style={{
                      flexShrink:     0,
                      width:          20, height: 20,
                      borderRadius:   6,
                      background:     'rgba(17,17,17,0.08)',
                      color:          'var(--accent)',
                      fontSize:       10,
                      fontWeight:     700,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      marginTop:      2,
                    }}>
                      {i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Experience */}
          {round.experience && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Experience
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{round.experience}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Action icon button ───────────────────────────────────────────────────────
const IconBtn = ({ onClick, title, danger, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width:       36, height: 36,
      borderRadius: 10,
      border:      '1px solid var(--border)',
      background:  'transparent',
      color:       'var(--text-muted)',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'center',
      cursor:      'pointer',
      transition:  'color 0.15s ease, border-color 0.15s ease, background 0.15s ease',
      flexShrink:  0,
    }}
    onMouseEnter={e => {
      if (danger) {
        e.currentTarget.style.color        = 'var(--danger)';
        e.currentTarget.style.borderColor  = 'rgba(255,69,58,0.3)';
        e.currentTarget.style.background   = 'rgba(255,69,58,0.08)';
      } else {
        e.currentTarget.style.color        = 'var(--text-primary)';
        e.currentTarget.style.borderColor  = 'rgba(17,17,17,0.22)';
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.color       = 'var(--text-muted)';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.background  = 'transparent';
    }}
  >
    {children}
  </button>
);

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHeading = ({ icon: Icon, iconColor, iconBg, children }) => (
  <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
    <span style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} style={{ color: iconColor }} />
    </span>
    {children}
  </h2>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const ExperienceDetailPage = () => {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const [exp,     setExp]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    experienceService.getById(id)
      .then(r => setExp(r.data.experience))
      .catch(() => { toast.error('Experience not found'); navigate(-1); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    try {
      const res = await experienceService.upvote(id);
      setExp(p => ({ ...p, upvoteCount: res.data.upvoteCount, hasUpvoted: res.data.action === 'upvoted' }));
    } catch { toast.error('Failed to upvote'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this experience?')) return;
    try {
      await experienceService.delete(id);
      toast.success('Experience deleted');
      navigate(-1);
    } catch { toast.error('Failed to delete'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (loading) return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}>
      <CompanyDetailSkeleton />
    </div>
  );
  if (!exp) return null;

  const isOwner = user?.id === exp.author?._id;
  const isCoord = user?.role === 'coordinator';

  return (
    <div
      className="page-enter"
      style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* ── Back ───────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        7,
          fontSize:   13,
          fontWeight: 500,
          color:      'var(--text-muted)',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          padding:    0,
          transition: 'color 0.15s ease',
          alignSelf:  'flex-start',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={15} /> Back to feed
      </button>

      {/* ── Hero card ──────────────────────────────────────────────── */}
      <div
        style={{
          background:   'var(--surface)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding:      'clamp(18px,3vw,26px)',
          boxShadow:    'var(--shadow-soft)',
        }}
      >
        {/* Top row: company + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <CompanyLogo logo={exp.company?.logo} name={exp.company?.name} size="md" />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
                {exp.company?.name}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{exp.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBtn onClick={handleShare} title="Copy link"><Share2 size={14} /></IconBtn>
            {(isOwner || isCoord) && (
              <IconBtn onClick={handleDelete} title="Delete" danger><Trash2 size={14} /></IconBtn>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div
          style={{
            display:    'flex',
            flexWrap:   'wrap',
            alignItems: 'center',
            gap:        10,
            marginTop:  16,
            paddingTop: 16,
            borderTop:  '1px solid var(--border)',
          }}
        >
          <VerdictBadge verdict={exp.verdict} size="md" />
          <DifficultyStars value={exp.difficulty} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exp.year}</span>
          {exp.rounds?.map((r, i) => <RoundTag key={i} type={r.type} />)}
        </div>

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={13} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {exp.isAnonymous || !exp.author ? 'Anonymous' : exp.author.name}
              </p>
              {exp.author && !exp.isAnonymous && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                  {[exp.author.branch, exp.author.batch].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(exp.createdAt)}</span>
        </div>
      </div>

      {/* ── Interview rounds ───────────────────────────────────────── */}
      {exp.rounds?.length > 0 && (
        <div>
          <SectionHeading
            icon={MessageSquare}
            iconBg="rgba(17,17,17,0.08)"
            iconColor="var(--accent)"
          >
            Interview Rounds ({exp.rounds.length})
          </SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {exp.rounds.map((r, i) => <RoundSection key={i} round={r} index={i} />)}
          </div>
        </div>
      )}

      {/* ── Tips ───────────────────────────────────────────────────── */}
      {exp.tips && (
        <div
          style={{
            background:   'rgba(38,38,38,0.06)',
            border:       '1px solid rgba(38,38,38,0.14)',
            borderRadius: 'var(--radius-card)',
            padding:      '18px 20px',
            // Accent left strip
            borderLeft:   '3px solid var(--warning)',
          }}
        >
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            <Lightbulb size={15} style={{ color: 'var(--warning)' }} /> Tips from the Author
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{exp.tips}</p>
        </div>
      )}

      {/* ── Tags ───────────────────────────────────────────────────── */}
      {exp.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {exp.tags.map(t => (
            <span
              key={t}
              style={{
                fontSize:     12,
                fontWeight:   500,
                padding:      '4px 12px',
                borderRadius: 'var(--radius-pill)',
                background:   'var(--surface-2)',
                border:       '1px solid var(--border)',
                color:        'var(--text-muted)',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* ── Upvote bar ─────────────────────────────────────────────── */}
      <div
        style={{
          background:     'var(--surface)',
          border:         '1px solid var(--border)',
          borderRadius:   'var(--radius-card)',
          padding:        '16px 20px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            14,
          boxShadow:      'var(--shadow-soft)',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Found this helpful? Give it an upvote!</p>
        <button
          onClick={handleUpvote}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          8,
            padding:      '9px 18px',
            borderRadius: 'var(--radius-input)',
            border:       `1px solid ${exp.hasUpvoted ? 'rgba(17,17,17,0.28)' : 'var(--border)'}`,
            background:   exp.hasUpvoted ? 'rgba(17,17,17,0.08)' : 'transparent',
            color:        exp.hasUpvoted ? 'var(--accent)'          : 'var(--text-muted)',
            fontWeight:   700,
            fontSize:     13,
            cursor:       'pointer',
            transition:   'all 0.18s ease',
            flexShrink:   0,
          }}
          onMouseEnter={e => { if (!exp.hasUpvoted) { e.currentTarget.style.borderColor = 'rgba(17,17,17,0.22)'; e.currentTarget.style.color = 'var(--accent)'; } }}
          onMouseLeave={e => { if (!exp.hasUpvoted) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
        >
          <ThumbsUp size={14} style={{ fill: exp.hasUpvoted ? 'var(--accent)' : 'none', color: exp.hasUpvoted ? 'var(--accent)' : 'inherit' }} />
          {exp.upvoteCount} Upvotes
        </button>
      </div>
    </div>
  );
};

export default ExperienceDetailPage;