import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, ChevronDown, LogOut, User, Settings,
  LayoutDashboard, Search
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import GlobalSearchBar from '../shared/GlobalSearchBar';
import NotifBell from '../shared/NotifBell';
import BrandLogo from '../shared/BrandLogo';
import Avatar from '../ui/Avatar';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Logo = () => <BrandLogo asLink size="sm" className="hover-lift" />;

const UserDropdown = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const [mobilePanelStyle, setMobilePanelStyle] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setMobilePanelStyle(null);
      return;
    }

    const positionPanel = () => {
      if (typeof window === 'undefined') return;

      if (window.innerWidth >= 640) {
        setMobilePanelStyle(null);
        return;
      }

      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const panelWidth = Math.min(252, window.innerWidth - 16);
      const anchorRight = triggerRect?.right ?? window.innerWidth - 8;
      const left = Math.max(8, Math.min(anchorRight - panelWidth, window.innerWidth - panelWidth - 8));
      const top = (triggerRect?.bottom ?? 64) + 8;

      setMobilePanelStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${panelWidth}px`,
      });
    };

    positionPanel();
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);

    return () => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  }, [open]);

  const roleColors = {
    student: 'text-[var(--accent)]',
    coordinator: 'text-[var(--accent)]',
    alumni: 'text-[var(--accent)]',
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--color-border)] hover-lift transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:hover:bg-[rgba(255,255,255,0.08)] dark:border dark:border-[rgba(255,255,255,0.08)]"
      >
        <Avatar name={user.name} size="sm" src={user.profilePic} />
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-none">{user.name}</span>
          <span className={`text-xs capitalize ${roleColors[user.role] || 'text-primary-400'}`}>{user.role}</span>
        </div>
        <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`card p-1.5 z-50 animate-slide-down shadow-[0_24px_56px_-42px_rgba(0,0,0,.7)] ${mobilePanelStyle ? '' : 'absolute right-0 top-full mt-2 w-56 sm:w-64'}`}
          style={mobilePanelStyle || undefined}
        >
          <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
          </div>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', to: `/${user.role}/dashboard` },
            { icon: User, label: 'Profile', to: '/profile' },
            { icon: Settings, label: 'Settings', to: '/settings' },
          ].map(({ icon: Icon, label, to }) => (
            <button
              key={label}
              onClick={() => { navigate(to); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          <div className="border-t border-[var(--color-border)] mt-1 pt-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = ({ onMenuToggle, menuOpen }) => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.66)] dark:bg-[rgba(10,10,10,0.62)] backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-secondary)] dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:border dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)]"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <Logo />
        </div>

        {/* ✅ GlobalSearchBar added here — visible only when authenticated */}
        {isAuthenticated && <GlobalSearchBar />}

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/search')}
                className="md:hidden relative w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-all duration-200 dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                aria-label="Open search"
              >
                <Search size={18} />
              </button>
              <NotifBell />
              <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
              <UserDropdown user={user} onLogout={handleLogout} />
            </>
          ) : (
            <div className="flex items-center gap-1.5 ml-2">
              {isLanding && (
                <>
                  <a href="#platform" className="hidden md:inline-flex text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-xl hover:bg-[var(--color-border)] transition-colors">
                    Platform
                  </a>
                  <a href="#features" className="hidden md:inline-flex text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-xl hover:bg-[var(--color-border)] transition-colors">
                    Features
                  </a>
                  <a href="#roles" className="hidden md:inline-flex text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-xl hover:bg-[var(--color-border)] transition-colors">
                    Roles
                  </a>
                </>
              )}
              {!isLanding && (
                <Link to="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-xl hover:bg-[var(--color-border)] transition-colors">
                  Sign In
                </Link>
              )}
              <Link to="/register" className="btn-primary h-10 px-5 rounded-xl text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;