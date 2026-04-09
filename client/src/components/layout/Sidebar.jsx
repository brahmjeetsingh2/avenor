import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FileText, BookOpen,
  DollarSign, Bell, BarChart3, Users, BrainCircuit,
  Search, GitCompare, Award
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { BrandMark } from '../shared/BrandLogo';
import Avatar from '../ui/Avatar';

const studentNav = [
  { icon: LayoutDashboard, label: 'Dashboard',        to: '/student/dashboard' },
  { icon: Building2,       label: 'Companies',        to: '/student/companies' },
  { icon: FileText,        label: 'My Applications',  to: '/student/applications' },
  { icon: BookOpen,        label: 'Experiences',      to: '/student/experiences' },
  { icon: BrainCircuit,    label: 'AI Interview Prep', to: '/student/ai-prep', badge: 'AI' },
  { icon: BarChart3,       label: 'AI History',       to: '/student/ai-history' },
  { icon: Award,           label: 'Referrals',       to: '/student/referrals' },
  { icon: Users,           label: 'Mentorship',      to: '/student/mentorship' },
  { icon: DollarSign,      label: 'Salary Insights',  to: '/student/salary' },
  { icon: GitCompare,      label: 'Offer Comparison', to: '/student/offers' },
  { icon: Bell,            label: 'Notifications',    to: '/student/notifications' },
  { icon: Search,          label: 'Search',           to: '/search' },
];

const coordinatorNav = [
  { icon: LayoutDashboard, label: 'Dashboard',      to: '/coordinator/dashboard' },
  { icon: Building2,       label: 'Companies',      to: '/coordinator/companies' },
  { icon: Users,           label: 'Shortlists',     to: '/coordinator/shortlists' },
  { icon: Bell,            label: 'Announcements',  to: '/coordinator/announcements' },
  { icon: BarChart3,       label: 'Analytics',      to: '/coordinator/analytics' },
  { icon: Search,          label: 'Search',         to: '/search' },
];

const alumniNav = [
  { icon: LayoutDashboard, label: 'Dashboard',      to: '/alumni/dashboard' },
  { icon: BookOpen,        label: 'Experience Hub', to: '/alumni/experiences' },
  { icon: Award,           label: 'Referrals',      to: '/alumni/referrals' },
  { icon: Users,           label: 'Mentorship Inbox', to: '/alumni/mentorship' },
  { icon: DollarSign,      label: 'Salary Insights', to: '/alumni/salary' },
  { icon: Search,          label: 'Search',         to: '/search' },
];

const navByRole = { student: studentNav, coordinator: coordinatorNav, alumni: alumniNav };

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = navByRole[user.role] || studentNav;

  const roleColors = {
    student:     'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    coordinator: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    alumni:      'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] z-30
          w-52 md:w-56 lg:w-64 flex flex-col
          glass border-r border-[var(--border)]
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          lg:translate-x-0 lg:sticky lg:top-16
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:opacity-100'}
          overflow-y-auto
        `}
      >
        {/* User profile mini */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.profilePic} size="md" online />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user.college || 'Engineering College'}</p>
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 capitalize border ${roleColors[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 stagger-children">
          {navItems.map(({ icon: Icon, label, to, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative border
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]
                ${isActive
                  ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)] shadow-[var(--shadow-soft)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--text-primary)] text-[var(--surface)] shadow-[var(--shadow-soft)]">
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent)] rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom brand */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <BrandMark size="xs" />
              <span className="text-xs text-[var(--text-muted)]">Avenor v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
