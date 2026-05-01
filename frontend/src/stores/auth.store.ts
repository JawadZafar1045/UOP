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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      setAuth: (user, token) => set({ user, accessToken: token, error: null }),
      logout: () => set({ user: null, accessToken: null, error: null }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'uop-auth-storage',
    }
  )
);
