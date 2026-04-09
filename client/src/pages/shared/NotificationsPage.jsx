import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import useNotificationStore from '../../store/notificationStore';
import Button from '../../components/ui/Button';

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

// ─── Type meta ────────────────────────────────────────────────────────────────
const TYPE_META = {
  announcement:   { icon: '📢', label: 'Announcement', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)' },
  shortlist:      { icon: '🎯', label: 'Shortlist', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
  status_update:  { icon: '📋', label: 'Status', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 8%, transparent)' },
  interview_slot: { icon: '📅', label: 'Interview', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  offer:          { icon: '🎉', label: 'Offer', color: 'var(--success)', bg: 'var(--success-bg)' },
  mentorship_request: { icon: '🤝', label: 'Mentorship', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)' },
  mentorship_update:  { icon: '✅', label: 'Mentorship', color: 'var(--success)', bg: 'var(--success-bg)' },
  general:        { icon: '🔔', label: 'General',      color: 'var(--text-muted)', bg: 'var(--surface-2)'     },
};

const FILTERS = [
  { id: '',               label: 'All'           },
  { id: 'announcement',   label: 'Announcements' },
  { id: 'shortlist',      label: 'Shortlists'    },
  { id: 'status_update',  label: 'Status'        },
  { id: 'interview_slot', label: 'Interviews'    },
  { id: 'offer',          label: 'Offers'        },
  { id: 'mentorship_request', label: 'Mentorship' },
  { id: 'mentorship_update',  label: 'Mentorship Updates' },
];

// ─── Notification row ─────────────────────────────────────────────────────────
const NotificationRow = ({ notif, onMarkRead, onDelete, onOpen }) => {
  const meta       = TYPE_META[notif.type] || TYPE_META.general;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen?.(notif)}
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          14,
        padding:      '14px 20px',
        background:   hovered
          ? (notif.isRead ? 'var(--surface-2)' : 'color-mix(in srgb, var(--surface-2) 76%, var(--accent) 24%)')
          : (notif.isRead ? 'transparent'       : 'color-mix(in srgb, var(--surface-2) 90%, var(--accent) 10%)'),
        transition:   'background 0.15s ease',
        position:     'relative',
        cursor:       'pointer',
      }}
    >
      {/* Unread left strip */}
      {!notif.isRead && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0' }} />
      )}

      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: meta.bg }}>
        {meta.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <p style={{
            fontSize:   13,
            lineHeight: 1.45,
            fontWeight: notif.isRead ? 500 : 700,
            color:      notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}>
            {notif.title}
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>
            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
          {notif.message}
        </p>

        {/* Type badge */}
        <span style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          4,
          fontSize:     10,
          fontWeight:   700,
          padding:      '2px 8px',
          borderRadius: 'var(--radius-pill)',
          marginTop:    8,
          background:   meta.bg,
          color:        meta.color,
          letterSpacing: '0.03em',
        }}>
          {meta.label}
        </span>
      </div>

      {/* Action buttons — visible on hover */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        4,
        flexShrink: 0,
        paddingTop: 2,
        opacity:    hovered ? 1 : 0,
        transition: 'opacity 0.18s ease',
      }}>
        {!notif.isRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notif._id); }}
            title="Mark as read"
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              color: 'var(--accent)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 16%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)'}
          >
            <CheckCheck size={13} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
          title="Delete"
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            color: 'var(--text-muted)',
            transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
};

// ─── Filter chip ──────────────────────────────────────────────────────────────
const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding:      '6px 14px',
      borderRadius: 'var(--radius-pill)',
      border:       `1px solid ${active ? 'color-mix(in srgb, var(--accent) 28%, transparent)' : 'var(--border)'}`,
      background:   active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
      color:        active ? 'var(--accent)' : 'var(--text-muted)',
      fontSize:     12,
      fontWeight:   600,
      cursor:       'pointer',
      transition:   'all 0.15s ease',
      whiteSpace:   'nowrap',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 24%, transparent)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
  >
    {children}
  </button>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const NotificationsPage = () => {
  const navigate = useNavigate();
  const { markOneRead, markAllRead: storeMarkAll, removeNotification, unreadCount } = useNotificationStore();
  const [notifications, setNotifs]   = useState([]);
  const [loading,       setLoading]  = useState(true);
  const [loadingMore,   setMore]     = useState(false);
  const [page,          setPage]     = useState(1);
  const [hasMore,       setHasMore]  = useState(true);
  const [typeFilter,    setType]     = useState('');
  const [unreadOnly,    setUnreadOnly] = useState(false);
  const loaderRef = useRef(null);

  const getNotificationTarget = (notif) => {
    if (notif?.data?.applicationId) {
      return { to: '/student/applications', state: { focusApplicationId: notif.data.applicationId } };
    }
    if (notif?.data?.companyId) {
      return { to: `/companies/${notif.data.companyId}` };
    }
    if (notif?.data?.referralId) {
      return { to: '/student/referrals' };
    }
    return null;
  };

  const fetchPage = useCallback(async (p, reset = false) => {
    if (p === 1) setLoading(true); else setMore(true);
    try {
      const params = { page: p, limit: 20 };
      if (typeFilter) params.type   = typeFilter;
      if (unreadOnly) params.unread = true;
      const res = await notificationService.getAll(params);
      setNotifs(prev => reset || p === 1 ? res.data : [...prev, ...res.data]);
      setHasMore(res.pagination.page < res.pagination.pages);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setMore(false);
    }
  }, [typeFilter, unreadOnly]);

  useEffect(() => { setPage(1); fetchPage(1, true); }, [typeFilter, unreadOnly]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loadingMore && !loading) {
        const next = page + 1;
        setPage(next);
        fetchPage(next);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  const handleMarkRead = async (id) => {
    markOneRead(id);
    setNotifs(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
    await notificationService.markRead(id).catch(() => {});
  };

  const handleMarkAll = async () => {
    storeMarkAll();
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    await notificationService.markAllRead().catch(() => {});
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (id) => {
    removeNotification(id);
    setNotifs(p => p.filter(n => n._id !== id));
    await notificationService.delete(id).catch(() => {});
  };

  const handleOpen = async (notif) => {
    const target = getNotificationTarget(notif);
    if (!target) return;
    if (!notif.isRead) {
      await handleMarkRead(notif._id);
    }
    navigate(target.to, { state: target.state || null });
  };

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16, padding: '18px 18px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={handleMarkAll} className="rounded-input border-[var(--border)] hover:border-[var(--accent)]/35">
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '2px 2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <FilterChip key={f.id} active={typeFilter === f.id} onClick={() => setType(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
        <FilterChip active={unreadOnly} onClick={() => setUnreadOnly(p => !p)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Filter size={11} /> Unread only
          </span>
        </FilterChip>
      </div>

      {/* ── Notification list ──────────────────────────────────────── */}
      <div style={{ background: themedSurface, border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>

        {/* Loading skeletons */}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          14,
              padding:      '14px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 4 }} />
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 24px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: themedWash, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Bell size={22} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No notifications</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {unreadOnly ? 'No unread notifications' : "You're all caught up!"}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && notifications.map((n, idx) => (
          <div
            key={n._id}
            style={{ borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <NotificationRow notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} onOpen={handleOpen} />
          </div>
        ))}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} style={{ height: 8 }} />

        {/* Load more spinner */}
        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <div
              style={{
                width:       20, height: 20,
                borderRadius: '50%',
                border:      '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                animation:   'spin 0.7s linear infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
