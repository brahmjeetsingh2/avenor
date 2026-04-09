import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} menuOpen={sidebarOpen} />
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className={`flex-1 min-w-0 min-h-[calc(100vh-4rem)] overflow-x-hidden ${isAuthenticated ? 'lg:ml-0' : ''}`}>
          <div className="h-full min-w-0 route-stage">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
