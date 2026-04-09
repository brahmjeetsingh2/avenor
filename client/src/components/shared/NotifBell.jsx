import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from '../../store/notificationStore';
import notificationService from '../../services/notificationService';
import useAuthStore from '../../store/authStore';

const TYPE_META = {
  announcement:  { icon: '📢', color: 'bg-[var(--surface-2)] text-[var(--accent)]' },
  shortlist:     { icon: '🎯', color: 'bg-[var(--surface-2)] text-[var(--accent)]' },
  status_update: { icon: '📋', color: 'bg-[var(--surface-2)] text-[var(--accent)]' },
  interview_slot:{ icon: '📅', color: 'bg-[var(--surface-2)] text-[var(--accent)]' },
  offer:         { icon: '🎉', color: 'bg-[var(--surface-2)] text-[var(--accent)]' },
  general:       { icon: '🔔', color: 'bg-[var(--color-border)] text-[var(--color-text-muted)]' },
};

const timeAgo = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
};

const NotifBell = () => {
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const triggerRef        = useRef(null);
  const [mobilePanelStyle, setMobilePanelStyle] = useState(null);
  const navigate          = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    notifications, unreadCount, initialized,
    setNotifications, markOneRead, markAllRead: storeMarkAll,
    removeNotification,
  } = useNotificationStore();

  // Load notifications once on mount
  useEffect(() => {
    if (!isAuthenticated || initialized) return;
    notificationService.getAll({ limit: 20 })
      .then(r => setNotifications(r.data))
      .catch(() => {});
  }, [isAuthenticated, initialized]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
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
      const panelWidth = Math.min(360, window.innerWidth - 16);
      const fallbackRight = window.innerWidth - 8;
      const anchorRight = triggerRect?.right ?? fallbackRight;
      const left = Math.max(8, Math.min(anchorRight - panelWidth, window.innerWidth - panelWidth - 8));
      const top = (triggerRect?.bottom ?? 56) + 8;

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

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    markOneRead(id);
    await notificationService.markRead(id).catch(() => {});
  };

  const handleMarkAll = async () => {
    storeMarkAll();
    await notificationService.markAllRead().catch(() => {});
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    removeNotification(id);
    await notificationService.delete(id).catch(() => {});
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const preview = notifications.slice(0, 5);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(p => !p)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-all duration-200 dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:border dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)]"
        aria-label="Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-pulse-slow' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-danger-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`card p-0 overflow-hidden z-50 animate-slide-down shadow-card-dark ${mobilePanelStyle ? '' : 'absolute right-0 top-full mt-2 w-[min(360px,calc(100vw-16px))]'}`}
          style={mobilePanelStyle || undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-[var(--color-text-primary)]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-danger-500/15 text-danger-500">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors dark:text-[var(--text-primary)] dark:hover:opacity-90"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {preview.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-border)] flex items-center justify-center mb-3">
                  <Bell size={18} className="text-[var(--color-text-muted)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">All caught up</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">No notifications yet</p>
              </div>
            ) : (
              preview.map((notif) => {
                const meta = TYPE_META[notif.type] || TYPE_META.general;
                return (
                  <div
                    key={notif._id}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 transition-colors cursor-pointer
                      ${!notif.isRead ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--color-border)]'}`}
                    onClick={(e) => !notif.isRead && handleMarkRead(notif._id, e)}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm ${meta.color}`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(notif._id, e)}
                          className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--accent)] transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                          title="Mark read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif._id, e)}
                        className="p-1 rounded-lg hover:bg-danger-500/20 text-[var(--color-text-muted)] hover:text-danger-500 transition-colors dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:hover:bg-[rgba(239,68,68,0.16)] dark:hover:text-[#fca5a5]"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors border-t border-[var(--color-border)] dark:text-[var(--text-primary)] dark:hover:bg-[rgba(255,255,255,0.08)]"
          >
            View all notifications <ExternalLink size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotifBell;
