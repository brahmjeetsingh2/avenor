import React from 'react';
import { LayoutDashboard, BookOpen, Award, DollarSign } from 'lucide-react';

const PlaceholderPage = ({ icon: Icon, title, description, part }) => (
  <div className="p-6 md:p-8 page-enter">
    <div className="max-w-2xl">
      <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-500/20 flex items-center justify-center mb-6">
        <Icon size={26} className="text-primary-600" />
      </div>
      <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] mb-3">{title}</h1>
      <p className="text-[var(--color-text-secondary)] mb-6 text-lg">{description}</p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
        🚧 Fully built in <span className="font-bold text-primary-600 ml-1">{part}</span>
      </div>
    </div>
  </div>
);

export const AlumniDashboard = () => (
  <PlaceholderPage
    icon={LayoutDashboard} title="Alumni Dashboard"
    description="Your impact dashboard. Experiences shared, juniors helped, referrals made."
    part="Part 5 & 6" />
);

export const AlumniExperiences = () => (
  <PlaceholderPage
    icon={BookOpen} title="Share Experiences"
    description="Post your interview experiences to help junior batches prepare. It takes 5 minutes to make a huge difference."
    part="Part 5" />
);

export const AlumniReferrals = () => (
  <PlaceholderPage
    icon={Award} title="Referral Network"
    description="Connect with juniors from your college. Help them get into your company."
    part="Part 7" />
);

export const AlumniSalary = () => (
  <PlaceholderPage
    icon={DollarSign} title="Salary Data"
    description="Share your real CTC anonymously. Help juniors negotiate better."
    part="Part 6" />
);
