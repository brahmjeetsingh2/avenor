import { create } from 'zustand';

const getNotificationKey = (notification) => (
  notification?._id
  || `${notification?.type || 'general'}:${notification?.title || ''}:${notification?.message || ''}`
);

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  initialized: false,

  setNotifications: (notifications) => {
    const unread = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount: unread, initialized: true });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: state.notifications.some((item) => getNotificationKey(item) === getNotificationKey(notification))
        ? state.notifications
        : [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.notifications.some((item) => getNotificationKey(item) === getNotificationKey(notification))
        ? state.unreadCount
        : state.unreadCount + 1,
    }));
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  markOneRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notif = state.notifications.find((n) => n._id === id);
      return {
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: notif && !notif.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },
}));

export default useNotificationStore;
