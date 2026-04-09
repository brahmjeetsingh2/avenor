import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useThemeStore from './store/themeStore';

// Layout
import AppLayout from './components/layout/AppLayout';

// Route guards
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from './components/shared/ProtectedRoute';

// Auth pages (real implementations)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

import StudentApplicationsPage  from './pages/student/StudentApplicationsPage';
import CoordinatorShortlistPage from './pages/coordinator/CoordinatorShortlistPage';

// Shared pages
import { NotFoundPage } from './pages/shared/SharedPages';
import CompaniesPage     from './pages/shared/CompaniesPage';
import CompanyDetailPage from './pages/shared/CompanyDetailPage';
import CompanyFormPage      from './pages/coordinator/CompanyFormPage';
import SalaryInsightsPage  from './pages/shared/SalaryInsightsPage';
import NotificationsPage   from './pages/shared/NotificationsPage';
import AnnouncementsPage     from './pages/coordinator/AnnouncementsPage';
import CoordinatorDashboardPage from './pages/coordinator/CoordinatorDashboard';
import StudentDashboardPage      from './pages/student/StudentDashboard';
import StudentReferralsPage      from './pages/student/StudentReferralsPage';
import StudentMentorshipRequestsPage from './pages/student/StudentMentorshipRequestsPage';
import AIInterviewPrepPage       from './pages/student/AIInterviewPrepPage';
import SearchResultsPage         from './pages/shared/SearchResultsPage';
import OAuthCallbackPage         from './pages/auth/OAuthCallbackPage';
import ProfilePageReal            from './pages/shared/ProfilePage';
import SettingsPageReal           from './pages/shared/SettingsPage';
import CoordinatorAnalyticsPage   from './pages/coordinator/CoordinatorAnalyticsPage';
import AlumniDashboardPage        from './pages/alumni/AlumniDashboard';
import AlumniReferralsPage        from './pages/alumni/AlumniReferralsPage';
import AlumniMentorshipInboxPage from './pages/alumni/AlumniMentorshipInboxPage';
import AlumniExperienceHubPage    from './pages/alumni/AlumniExperienceHubPage';
import AlumniSalaryContributionsPage from './pages/alumni/AlumniSalaryContributionsPage';
import useSocket            from './hooks/useSocket';
import OfferComparisonPage from './pages/shared/OfferComparisonPage';
import ExperienceFeedPage  from './pages/shared/ExperienceFeedPage';
import ExperienceDetailPage from './pages/shared/ExperienceDetailPage';
import PostExperiencePage  from './pages/shared/PostExperiencePage';
import MentorshipSessionPage from './pages/shared/MentorshipSessionPage';

// Landing
import LandingPage from './pages/LandingPage';

const PageLoader = () => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center page-enter">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl border border-primary-500/20 animate-ping" />
        <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 animate-pulse" />
        <div className="relative w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]" />
      </div>
      <p className="text-sm text-[var(--color-text-muted)] tracking-[0.04em]">Loading your workspace...</p>
    </div>
  </div>
);

const ThemeSectionSync = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || '/';
    let section = 'shared';

    if (path === '/') section = 'landing';
    else if (path.startsWith('/student')) section = 'student';
    else if (path.startsWith('/coordinator')) section = 'coordinator';
    else if (path.startsWith('/alumni')) section = 'alumni';
    else if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password') || path.startsWith('/oauth-callback')) section = 'auth';

    document.body.setAttribute('data-theme-section', section);
  }, [location.pathname]);

  return null;
};

const App = () => {
  const { initTheme } = useThemeStore();

  useSocket(); // Connects socket when authenticated, disconnects on logout

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <ThemeSectionSync />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: 'var(--shadow-soft)',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--text-reverse)' } },
          error:   { iconTheme: { primary: 'var(--danger)', secondary: 'var(--text-reverse)' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/oauth-callback"  element={<OAuthCallbackPage />} />

            {/* Student */}
            <Route path="/student/dashboard"    element={<RoleRoute roles={['student']}><StudentDashboardPage /></RoleRoute>} />
            <Route path="/student/companies"    element={<RoleRoute roles={['student']}><CompaniesPage /></RoleRoute>} />
            <Route path="/companies/:id"          element={<ProtectedRoute><CompanyDetailPage /></ProtectedRoute>} />
            <Route path="/student/applications" element={<RoleRoute roles={['student']}><StudentApplicationsPage /></RoleRoute>} />
            <Route path="/student/experiences"  element={<RoleRoute roles={['student']}><ExperienceFeedPage /></RoleRoute>} />
            <Route path="/student/ai-prep"      element={<RoleRoute roles={['student']}><AIInterviewPrepPage /></RoleRoute>} />
            <Route path="/student/ai-history"   element={<RoleRoute roles={['student']}><AIInterviewPrepPage initialTab="history" /></RoleRoute>} />
            <Route path="/student/referrals"    element={<RoleRoute roles={['student']}><StudentReferralsPage /></RoleRoute>} />
            <Route path="/student/mentorship"   element={<RoleRoute roles={['student']}><StudentMentorshipRequestsPage /></RoleRoute>} />
            <Route path="/student/salary"       element={<RoleRoute roles={['student']}><SalaryInsightsPage /></RoleRoute>} />
            <Route path="/student/offers"       element={<RoleRoute roles={['student']}><OfferComparisonPage /></RoleRoute>} />
            <Route path="/student/notifications" element={<RoleRoute roles={['student']}><NotificationsPage /></RoleRoute>} />
            <Route path="/notifications"          element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* Coordinator */}
            <Route path="/coordinator/dashboard"    element={<RoleRoute roles={['coordinator']}><CoordinatorDashboardPage /></RoleRoute>} />
            <Route path="/coordinator/companies"          element={<RoleRoute roles={['coordinator']}><CompaniesPage /></RoleRoute>} />
            <Route path="/coordinator/companies/new"      element={<RoleRoute roles={['coordinator']}><CompanyFormPage /></RoleRoute>} />
            <Route path="/coordinator/companies/:id/edit" element={<RoleRoute roles={['coordinator']}><CompanyFormPage /></RoleRoute>} />
            <Route path="/coordinator/shortlists"   element={<RoleRoute roles={['coordinator']}><CoordinatorShortlistPage /></RoleRoute>} />
            <Route path="/coordinator/announcements" element={<RoleRoute roles={['coordinator']}><AnnouncementsPage /></RoleRoute>} />
            <Route path="/coordinator/analytics"    element={<RoleRoute roles={['coordinator']}><CoordinatorAnalyticsPage /></RoleRoute>} />

            {/* Alumni */}
            <Route path="/alumni/dashboard"   element={<RoleRoute roles={['alumni']}><AlumniDashboardPage /></RoleRoute>} />
            <Route path="/alumni/experiences" element={<RoleRoute roles={['alumni']}><AlumniExperienceHubPage /></RoleRoute>} />
            <Route path="/alumni/experiences/new" element={<RoleRoute roles={['alumni']}><PostExperiencePage /></RoleRoute>} />
            <Route path="/alumni/referrals"   element={<RoleRoute roles={['alumni']}><AlumniReferralsPage /></RoleRoute>} />
            <Route path="/alumni/mentorship"  element={<RoleRoute roles={['alumni']}><AlumniMentorshipInboxPage /></RoleRoute>} />
            <Route path="/alumni/salary"      element={<RoleRoute roles={['alumni']}><AlumniSalaryContributionsPage /></RoleRoute>} />

            {/* Shared */}
            <Route path="/experiences"     element={<ProtectedRoute><ExperienceFeedPage /></ProtectedRoute>} />
            <Route path="/experiences/new" element={<RoleRoute roles={['student','alumni']}><PostExperiencePage /></RoleRoute>} />
            <Route path="/experiences/:id" element={<ProtectedRoute><ExperienceDetailPage /></ProtectedRoute>} />
            <Route path="/search"   element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
            <Route path="/profile"  element={<ProtectedRoute><ProfilePageReal /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPageReal /></ProtectedRoute>} />
            <Route path="/mentorship/:id" element={<RoleRoute roles={['student', 'alumni']}><MentorshipSessionPage /></RoleRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
