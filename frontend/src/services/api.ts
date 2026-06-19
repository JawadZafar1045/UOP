import axios from 'axios';
import { useStore } from '../store/useStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Singleton refresh lock ────────────────────────────────────────────────────
// Prevents a race condition where N simultaneous 401s each call /auth/refresh.
// Only the FIRST 401 performs the refresh; all others queue and wait for it.
// When the single refresh completes every queued request retries automatically.
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject:  (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  refreshQueue = [];
};

// ── Response interceptor: silent token refresh on 401 ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // ── Another refresh is already in flight ──────────────────────────────
      // Queue this request; it will be replayed once the first refresh settles.
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // ── First 401 — acquire the lock and perform the refresh ──────────────
      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setAuth, logout, user } = useStore.getState();

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error.response?.data || error.message);
      }

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const res = await axios.post(
          `${baseUrl}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        // Support both { data: { accessToken, refreshToken } } and flat shapes
        const payload = res.data?.data || res.data;
        const { accessToken, refreshToken: newRefreshToken } = payload;

        // Persist new tokens — keep the existing user object
        setAuth(user!, accessToken, newRefreshToken);

        // Unblock all queued requests with the new token
        processQueue(null, accessToken);

        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed — reject every waiting request and log the user out once
        processQueue(refreshError, null);
        logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        // Always release the lock, even if an unexpected error occurs
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
