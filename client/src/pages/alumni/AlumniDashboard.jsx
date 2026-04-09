import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, CalendarClock, DollarSign, Plus, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import dashboardService from '../../services/dashboardService';

const StatCard = ({ icon: Icon, label, value, to, tone, hoverBorder = 'hover:border-[var(--accent)]' }) => (
  <Link to={to} className={`card p-5 flex items-center gap-4 ${hoverBorder} hover:shadow-[var(--shadow-hover)] transition-all group`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <p className="font-display text-2xl font-bold text-[var(--color-text-primary)] leading-none">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{label}</p>
    </div>
    <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--accent)]" />
  </Link>
);

const AlumniDashboard = () => {
  const { user } = useAuth();
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      if (requestRef.current) requestRef.current.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      try {
        const res = await dashboardService.getAlumniImpact({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setImpact(res);
      } catch {
        if (controller.signal.aborted) return;
        toast.error('Failed to load alumni dashboard');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
        if (requestRef.current === controller) requestRef.current = null;
      }
    };

    load();

    return () => {
      if (requestRef.current) requestRef.current.abort();
    };
  }, []);

  return (
    <div className="p-4 md:p-6 page-enter space-y-6 max-w-[1360px] mx-auto overflow-x-hidden">
      <section className="hero-shell hero-shell--alumni p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} src={user?.profilePic} size="lg" />
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Alumni Impact Dashboard</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Track your contributions and help more students with clear next actions.</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap w-full lg:w-auto">
            <Link to="/alumni/experiences/new" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-reverse)] text-sm font-bold shadow-md hover:brightness-110 transition-all w-full sm:w-auto">
              <BookOpen size={14} /> Share Experience
            </Link>
            <Link to="/alumni/referrals" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-reverse)] text-sm font-bold shadow-md hover:brightness-110 transition-all w-full sm:w-auto">
              <Award size={14} /> Post Referral
            </Link>
            <Link to="/alumni/salary" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)] text-[var(--text-reverse)] text-sm font-bold shadow-md hover:brightness-110 transition-all w-full sm:w-auto">
              <DollarSign size={14} /> Submit Salary
            </Link>
          </div>
        </div>
      </section>

      {loading || !impact ? (
        <div className="card p-8 text-sm text-[var(--color-text-muted)]">Loading your impact...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="Experiences Shared" value={impact.experiencesShared} to="/alumni/experiences" tone="bg-[var(--surface-2)] text-[var(--accent)]" hoverBorder="hover:border-[var(--accent)]" />
            <StatCard icon={Award} label="Referrals Posted" value={impact.referralsPosted} to="/alumni/referrals" tone="bg-[var(--surface-2)] text-[var(--accent)]" hoverBorder="hover:border-[var(--accent)]" />
            <StatCard icon={Users} label="Students Helped" value={impact.studentsHelped} to="/alumni/referrals" tone="bg-[var(--surface-2)] text-[var(--accent)]" hoverBorder="hover:border-[var(--accent)]" />
            <StatCard icon={DollarSign} label="Salary Contributions" value={impact.salaryContributions} to="/alumni/salary" tone="bg-[var(--surface-2)] text-[var(--accent)]" hoverBorder="hover:border-[var(--accent)]" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">Recent Contributions</h2>
              {impact.recentImpact?.length ? impact.recentImpact.map((item, idx) => (
                <div key={`${item.type}-${idx}`} className="rounded-xl border border-[var(--color-border)] p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{item.meta}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">{item.type}</span>
                </div>
              )) : (
                <div className="rounded-xl border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
                  Share your first experience to start your impact timeline.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <h2 className="font-display font-bold text-base flex items-center gap-2"><Sparkles size={15} className="text-[var(--accent)]" /> Alumni Analytics</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-[var(--color-text-muted)]">Companies contributed to</span><span className="font-semibold">{impact.companiesContributedTo}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--color-text-muted)]">Referral clicks</span><span className="font-semibold">{impact.referralClicks}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--color-text-muted)]">Students helped this month</span><span className="font-semibold">{impact.studentsHelpedThisMonth}</span></div>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="font-display font-bold text-base flex items-center gap-2"><CalendarClock size={15} className="text-[var(--accent)]" /> Upcoming Referral Expiries</h2>
                <div className="mt-3 space-y-2">
                  {impact.upcomingReferralExpiries?.length ? impact.upcomingReferralExpiries.map((r) => (
                    <div key={r._id} className="rounded-xl border border-[var(--color-border)] p-3">
                      <p className="text-sm font-semibold">{r.company} - {r.role}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Expires {new Date(r.expiresAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  )) : <p className="text-sm text-[var(--color-text-muted)]">No referral expiries in the next 14 days.</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AlumniDashboard;
