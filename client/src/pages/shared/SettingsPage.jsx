import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Shield, Trash2, LogOut, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import Modal from '../../components/ui/Modal';

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

// ─── Theme store needs system mode support ────────────────────────────────────
const getSystemPreference = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const SettingRow = ({ icon: Icon, label, description, children, danger }) => (
  <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0">
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
        ${danger ? 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
        <Icon size={15} />
      </div>
      <div>
        <p className={`text-sm font-semibold ${danger ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="shrink-0 ml-4">{children}</div>
  </div>
);

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 border
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]
      ${enabled ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}
  >
    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform
      ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

// ─── Reusable modal confirm button row ────────────────────────────────────────
const ModalActions = ({ onCancel, onConfirm, confirmLabel, loading, variant = 'danger' }) => (
  <div className="flex items-center gap-3 w-full">
    <Button
      onClick={onCancel}
      variant="secondary"
      size="sm"
      className="flex-1"
    >
      Cancel
    </Button>
    <Button
      onClick={onConfirm}
      disabled={loading}
      variant={variant === 'danger' ? 'danger' : 'accent'}
      size="sm"
      className={`flex-1 disabled:opacity-60
        ${variant === 'danger'
          ? 'shadow-none'
          : 'shadow-[var(--shadow-soft)]'
        }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Please wait…
        </span>
      ) : confirmLabel}
    </Button>
  </div>
);

const SettingsPage = () => {
  const { toggleTheme, isDark } = useTheme();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // System theme: track if user chose system mode
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('avenor-theme-mode') || (isDark ? 'dark' : 'light');
  });

  const handleThemeSelect = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('avenor-theme-mode', mode);

    if (mode === 'system') {
      const sysPref = getSystemPreference();
      // Apply system preference
      if (sysPref === 'dark' && !isDark) toggleTheme();
      if (sysPref === 'light' && isDark) toggleTheme();
      // Listen for system changes
    } else if (mode === 'dark' && !isDark) {
      toggleTheme();
    } else if (mode === 'light' && isDark) {
      toggleTheme();
    }
  };

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (e.matches && !isDark) toggleTheme();
      if (!e.matches && isDark) toggleTheme();
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode, isDark, toggleTheme]);

  const [notifSettings, setNotifSettings] = useState({
    statusUpdates:  true,
    announcements:  true,
    newExperiences: false,
    offers:         true,
  });

  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loggingOut,  setLoggingOut]  = useState(false);

  const setNotif = (key, val) => setNotifSettings(p => ({ ...p, [key]: val }));

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires contacting support.');
    setDeleteModal(false);
  };

  const roleColors = {
    student: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    coordinator: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    alumni: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your preferences</p>
      </div>

      {/* ── Appearance ─────────────────────────────────────────────── */}
      <div className="card p-6 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider mb-1">
          Appearance
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Choose how Avenor looks for you</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light',  icon: Sun,     label: 'Light'  },
            { id: 'dark',   icon: Moon,    label: 'Dark'   },
            { id: 'system', icon: Monitor, label: 'System' },
          ].map(({ id, icon: Icon, label }) => {
            const isActive = themeMode === id;
            return (
              <button
                key={id}
                onClick={() => handleThemeSelect(id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200
                  ${isActive
                    ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] shadow-[var(--shadow-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/35 hover:bg-[var(--surface-2)]'
                  }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}
                />
                <span className={`text-xs font-semibold ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notifications ──────────────────────────────────────────── */}
      <div className="card p-6 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider mb-1">
          Notifications
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Choose what you get notified about</p>

        <SettingRow icon={Bell} label="Status Updates" description="When your application status changes">
          <Toggle enabled={notifSettings.statusUpdates} onChange={v => setNotif('statusUpdates', v)} />
        </SettingRow>
        <SettingRow icon={Bell} label="Announcements" description="Company announcements from coordinators">
          <Toggle enabled={notifSettings.announcements} onChange={v => setNotif('announcements', v)} />
        </SettingRow>
        <SettingRow icon={Bell} label="New Experiences" description="When seniors post new interview experiences">
          <Toggle enabled={notifSettings.newExperiences} onChange={v => setNotif('newExperiences', v)} />
        </SettingRow>
        <SettingRow icon={Bell} label="Offer Notifications" description="When you receive an offer">
          <Toggle enabled={notifSettings.offers} onChange={v => setNotif('offers', v)} />
        </SettingRow>
      </div>

      {/* ── Account ────────────────────────────────────────────────── */}
      <div className="card p-6 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider mb-1">
          Account
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Your account details</p>
        <SettingRow icon={Shield} label="Role" description={`Registered as ${user?.role}`}>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize border ${roleColors[user?.role] || roleColors.student}`}>
            {user?.role}
          </span>
        </SettingRow>
      </div>

      {/* ── Danger Zone ────────────────────────────────────────────── */}
      <div className="card p-6 border-[var(--danger-border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h2 className="font-display font-bold text-sm text-[var(--danger)] uppercase tracking-wider mb-1">
          Danger Zone
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Irreversible actions - proceed with caution</p>

        <SettingRow
          icon={LogOut}
          label="Sign Out"
          description="Sign out from this device"
          danger
        >
          <button
            onClick={() => setLogoutModal(true)}
            className="text-sm font-bold px-4 py-2 rounded-xl border-2 border-[var(--danger-border)] text-[var(--danger)] bg-[var(--danger-bg)] hover:bg-[var(--danger)] hover:text-[var(--text-reverse)] transition-all duration-200"
          >
            Sign Out
          </button>
        </SettingRow>

        <SettingRow
          icon={Trash2}
          label="Delete Account"
          description="Permanently delete all your data"
          danger
        >
          <button
            onClick={() => setDeleteModal(true)}
            className="text-sm font-bold px-4 py-2 rounded-xl border-2 border-[var(--danger-border)] text-[var(--danger)] bg-[var(--danger-bg)] hover:bg-[var(--danger)] hover:text-[var(--text-reverse)] transition-all duration-200"
          >
            Delete
          </button>
        </SettingRow>
      </div>

      {/* ── Sign Out Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        title="Sign Out"
        size="sm"
        footer={
          <ModalActions
            onCancel={() => setLogoutModal(false)}
            onConfirm={handleLogout}
            confirmLabel="Yes, Sign Out"
            loading={loggingOut}
            variant="danger"
          />
        }
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Are you sure you want to sign out of Avenor?
        </p>
      </Modal>

      {/* ── Delete Account Modal ────────────────────────────────────── */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Account"
        size="sm"
        footer={
          <ModalActions
            onCancel={() => setDeleteModal(false)}
            onConfirm={handleDeleteAccount}
            confirmLabel="Delete My Account"
            variant="danger"
          />
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            This will permanently delete your account, all applications, experiences, and salary data.
          </p>
          <div className="p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)]">
            <p className="text-sm font-bold text-[var(--danger)]">⚠️ This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;