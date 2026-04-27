import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  tenantId?: string;
}

interface AppState {
  user: User | null;
  accessToken: string | null;
  notifications: any[];
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  addNotification: (note: any) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      notifications: [],
      setAuth: (user, token) => set({ user, accessToken: token }),
      logout: () => set({ user: null, accessToken: null, notifications: [] }),
      addNotification: (note) => set((state) => ({ notifications: [note, ...state.notifications] })),
    }),
    {
      name: 'uop-storage',
    }
  )
);
