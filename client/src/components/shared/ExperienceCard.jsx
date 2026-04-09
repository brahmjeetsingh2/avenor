import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, ArrowRight, User, MessageSquare } from 'lucide-react';
import { timeAgo, DifficultyStars, VerdictBadge, RoundTag } from '../../utils/experienceHelpers';
import { CompanyLogo } from './CompanyCard';
import experienceService from '../../services/experienceService';
import toast from 'react-hot-toast';

const ExperienceCard = ({ experience: initialExp, compact = false }) => {
  const [exp, setExp] = useState(initialExp);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await experienceService.upvote(exp._id);
      setExp((p) => ({
        ...p,
        upvoteCount: res.data.upvoteCount,
        hasUpvoted: res.data.action === 'upvoted',
      }));
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const authorName = exp.isAnonymous || !exp.author
    ? 'Anonymous'
    : exp.author.name;

  const authorSub = exp.isAnonymous || !exp.author
    ? null
    : [exp.author.branch, exp.author.batch].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/experiences/${exp._id}`}
      className="card p-4 sm:p-5 flex flex-col gap-4 hover:border-[var(--accent)]/30 hover:shadow-[var(--shadow-hover)] transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyLogo logo={exp.company?.logo} name={exp.company?.name} size="sm" />
          <div className="min-w-0">
            <p className="font-bold text-[var(--color-text-primary)] text-sm group-hover:text-[var(--accent)] transition-colors truncate">
              {exp.company?.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate leading-[1.35]">{exp.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <VerdictBadge verdict={exp.verdict} />
          <span className="text-[10px] text-[var(--color-text-muted)]">{exp.year}</span>
        </div>
      </div>

      {/* Rounds */}
      {exp.rounds?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exp.rounds.map((r, i) => <RoundTag key={i} type={r.type} />)}
        </div>
      )}

      {/* Tips preview */}
      {exp.tips && !compact && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 min-h-[2.75rem]">
          {exp.tips}
        </p>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--color-border)]">
        {/* Author */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            <User size={12} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] truncate">{authorName}</p>
            {authorSub && <p className="text-[10px] text-[var(--color-text-muted)] truncate">{authorSub}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Difficulty */}
          <DifficultyStars value={exp.difficulty} size={11} />

          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all
              ${exp.hasUpvoted
                ? 'bg-[var(--surface-2)] border-[var(--accent)] text-[var(--accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
              }`}
          >
            <ThumbsUp size={12} className={exp.hasUpvoted ? 'fill-current' : ''} />
            {exp.upvoteCount}
          </button>

          <ArrowRight size={13} className="text-[var(--color-text-muted)] group-hover:text-[var(--accent)] transition-colors" />
        </div>
      </div>
    </Link>
  );
};

export default ExperienceCard;
