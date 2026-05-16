"use client";

import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { io } from "socket.io-client";
import { useNotificationStore } from "@/store/notificationStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!user) {
      router.push("/login");
    } else {
      // User is authenticated, setup notifications
      useNotificationStore.getState().fetchNotifications();

      // Get token from where it's stored, assuming localStorage for now, 
      // or if it's in a cookie/api interceptor, we might just rely on the session if socketio supports it without token in url.
      // Usually, we'd need the token. Let's assume we can get it from localStorage or the store.
      // Assuming store doesn't have token directly exposed, we might need to rely on the backend session if possible, 
      // or grab it from localStorage if that's how this app works. Let's check how api.ts handles it if needed.
      // For now, I'll use the user object's token if available, or try localStorage.
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token }
      });

      socket.on('notification', (notif) => {
        useNotificationStore.getState().addNotification(notif);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user, router]);

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex items-center gap-2 text-slate-400">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <p className="text-sm font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
