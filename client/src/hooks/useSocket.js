import { useEffect, useRef } from 'react';
import { createElement } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:8000';

const TYPE_ICONS = {
  announcement:  '📢',
  shortlist:     '🎯',
  status_update: '📋',
  interview_slot:'📅',
  new_experience:'📝',
  offer:         '🎉',
  general:       '🔔',
};

const useSocket = () => {
  const socketRef = useRef(null);
  const { token, isAuthenticated } = useAuthStore();
  const { addNotification, setUnreadCount } = useNotificationStore();
  const lastToastAtRef = useRef(0);
  const lastToastKeyRef = useRef('');

  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current?.connected) return;

    socketRef.current = io(SOCKET_URL, {
      auth: (cb) => cb({ token: tokenRef.current }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on('connect', () => {});

    socketRef.current.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });

    const handleNotification = (notif) => {
      addNotification(notif);

      const key = notif?._id || `${notif?.type || 'general'}:${notif?.title || ''}:${notif?.message || ''}`;
      const now = Date.now();

      if (lastToastKeyRef.current === key && now - lastToastAtRef.current < 4000) {
        return;
      }

      if (now - lastToastAtRef.current < 1200) {
        return;
      }

      lastToastKeyRef.current = key;
      lastToastAtRef.current = now;

      const icon = TYPE_ICONS[notif.type] || '🔔';
      const isOffer = notif.type === 'offer';

      toast(
        (t) =>
          createElement(
            'div',
            {
              onClick: () => toast.dismiss(t.id),
              className: 'flex items-start gap-3 cursor-pointer',
            },
            createElement('span', { className: 'text-lg shrink-0' }, icon),
            createElement(
              'div',
              null,
              createElement(
                'p',
                { className: 'text-sm font-bold text-[var(--color-text-primary)]' },
                notif.title
              ),
              createElement(
                'p',
                { className: 'text-xs text-[var(--color-text-secondary)] mt-0.5' },
                notif.message
              )
            )
          ),
        {
          duration: isOffer ? 8000 : 5000,
          style: {
            background: isOffer ? 'rgba(34,197,94,0.1)' : 'var(--color-card)',
            border: isOffer ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '12px 16px',
            maxWidth: '380px',
          },
        }
      );
    };

    socketRef.current.off('notification:new');
    socketRef.current.on('notification:new', handleNotification);

    socketRef.current.on('disconnect', () => {});

    return () => {
      if (socketRef.current) {
        socketRef.current.off('notification:new', handleNotification);
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token, addNotification]);

  return socketRef.current;
};

export default useSocket;