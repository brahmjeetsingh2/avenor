import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, PenLine, Sparkles } from 'lucide-react';
import ExperienceFeedPage from '../shared/ExperienceFeedPage';

const AlumniExperienceHubPage = () => {
  const location = useLocation();
  const summary = location.state?.experienceSummary;

  return (
    <div className="space-y-4 max-w-[1360px] mx-auto overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-4 md:px-6 pt-4">
        <div className="hero-shell hero-shell--alumni p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Experience Hub</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Browse community experiences and quickly share your own in a dedicated alumni flow.
              </p>
            </div>
            <Link
              to="/alumni/experiences/new"
              className="inline-flex items-center justify-center gap-2 bg-coral-500 hover:bg-coral-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-[0_14px_32px_-24px_rgba(233,95,88,.95)] transition-colors w-full sm:w-auto"
            >
              <PenLine size={14} /> Share Experience
            </Link>
          </div>

          {summary && (
            <div className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--status-success)]" />
              Shared successfully: {summary.company} - {summary.role}. Thanks for helping juniors prepare.
            </div>
          )}

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="card p-3">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Browse Experiences</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Find interview patterns, round breakdowns, and practical tips.</p>
            </div>
            <div className="card p-3">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Share Experience</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Use the guided form to post your interview journey in minutes.</p>
            </div>
          </div>
        </div>
      </div>

      <ExperienceFeedPage />
    </div>
  );
};

export default AlumniExperienceHubPage;
