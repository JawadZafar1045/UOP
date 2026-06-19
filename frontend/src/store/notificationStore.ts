import { create } from 'zustand';
import * as notificationService from '../services/notification.service';

export interface Notification {
  _id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (notif: Notification) => void;
  toggleOpen: () => void;
  closeOpen: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        set({
          notifications: response.data.notifications || [],
          unreadCount: response.data.unreadCount || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      const currentNotifications = get().notifications;
      const notificationToMark = currentNotifications.find(n => n._id === id);
      
      if (notificationToMark && !notificationToMark.isRead) {
        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map(n => 
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
        
        await notificationService.markAsRead(id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update could go here if needed, but for notifications it's often fine to just log
      get().fetchNotifications(); // Refetch to sync state
    }
  },

  markAllRead: async () => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
      
      await notificationService.markAllRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      get().fetchNotifications(); // Refetch to sync state
    }
  },

  addNotification: (notif: Notification) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  closeOpen: () => set({ isOpen: false }),
}));
