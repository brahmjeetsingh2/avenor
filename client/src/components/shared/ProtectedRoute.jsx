import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Protect any route — redirect to login if not authenticated
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Restrict to specific roles
export const RoleRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user?.role)) {
    const dashboards = {
      student: '/student/dashboard',
      coordinator: '/coordinator/dashboard',
      alumni: '/alumni/dashboard',
    };
    return <Navigate to={dashboards[user?.role] || '/'} replace />;
  }

  return children;
};

// Redirect logged-in users away from auth pages
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const dashboards = {
      student: '/student/dashboard',
      coordinator: '/coordinator/dashboard',
      alumni: '/alumni/dashboard',
    };
    return <Navigate to={dashboards[user.role] || '/'} replace />;
  }

  return children;
};
