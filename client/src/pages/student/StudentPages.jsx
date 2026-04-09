import React from 'react';
import {
  LayoutDashboard, FileText, BookOpen, BrainCircuit,
  DollarSign, GitCompare, Bell,
} from 'lucide-react';

// ─── Placeholder page ─────────────────────────────────────────────────────────
const PlaceholderPage = ({
  icon: Icon,
  title,
  description,
  part,
  iconBg    = 'rgba(10, 132, 255, 0.12)',
  iconColor = 'var(--accent)',
}) => (
  <div className="page-enter" style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
    <div style={{ maxWidth: 560 }}>

      {/* Icon */}
      <div
        style={{
          width: 52, height: 52,
          borderRadius: 14,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Icon size={24} style={{ color: iconColor }} />
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          marginBottom: 10,
        }}
      >
        {title}
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          marginBottom: 24,
        }}
      >
        {description}
      </p>

      {/* "Coming in" pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 16px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        🚧 Fully built in
        <span style={{ fontWeight: 700, color: 'var(--accent)', marginLeft: 2 }}>
          {part}
        </span>
      </div>
    </div>
  </div>
);

// ─── Student pages ────────────────────────────────────────────────────────────
export const StudentDashboard = () => (
  <PlaceholderPage
    icon={LayoutDashboard}
    title="Student Dashboard"
    description="Your placement command center. Active companies, application statuses, upcoming deadlines, and AI-powered insights."
    part="Part 3 & 4"
  />
);

export const StudentApplications = () => (
  <PlaceholderPage
    icon={FileText}
    title="My Applications"
    description="Kanban board tracking every application — applied, shortlisted, interview rounds, offer, rejected."
    part="Part 4"
  />
);

export const StudentExperiences = () => (
  <PlaceholderPage
    icon={BookOpen}
    title="Interview Experiences"
    description="Browse and post interview experiences. Full-text search, upvotes, and feed ranking."
    part="Part 5"
    iconBg="rgba(52, 199, 89, 0.12)"
    iconColor="var(--status-success)"
  />
);

export const StudentAIPrep = () => (
  <PlaceholderPage
    icon={BrainCircuit}
    title="AI Interview Prep"
    description="Select a company and role — AI summarises all past experiences and generates your personalised prep checklist."
    part="Part 9"
    iconBg="rgba(10, 132, 255, 0.12)"
    iconColor="var(--accent)"
  />
);

export const StudentSalary = () => (
  <PlaceholderPage
    icon={DollarSign}
    title="Salary Insights"
    description="Anonymous salary data across all companies. Real CTCs, not rumours."
    part="Part 6"
    iconBg="rgba(52, 199, 89, 0.12)"
    iconColor="var(--status-success)"
  />
);

export const StudentOffers = () => (
  <PlaceholderPage
    icon={GitCompare}
    title="Offer Comparison"
    description="Side-by-side comparison of all your offers — CTC, role, location, bond, perks."
    part="Part 6"
    iconBg="rgba(10, 132, 255, 0.10)"
    iconColor="var(--accent)"
  />
);

export const StudentNotifications = () => (
  <PlaceholderPage
    icon={Bell}
    title="Notifications"
    description="Real-time notifications for shortlists, status updates, interview slots, and announcements."
    part="Part 7"
    iconBg="rgba(255, 159, 10, 0.12)"
    iconColor="var(--warning)"
  />
);