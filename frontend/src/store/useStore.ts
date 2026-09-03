import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  tenantId?: string;
  phone?: string;
  location?: string;
  bio?: string;
  programId?: string;
  requestedProgramId?: string;
  majorId?: string;
  isApproved?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
  district?: string;
  degreeQualification?: string;
  workExperience?: string;
  currentJobTitle?: string;
}

interface AppState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  notifications: any[];
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  addNotification: (note: any) => void;
  updateUser: (data: Partial<User>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      notifications: [],
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, notifications: [] }),
      addNotification: (note) =>
        set((state) => ({ notifications: [note, ...state.notifications] })),
      updateUser: (data) =>
        set((state) => ({ 
          user: state.user ? { ...state.user, ...data } : null 
        })),
    }),
    {
      name: 'cszone-storage',
    }
  )
);
