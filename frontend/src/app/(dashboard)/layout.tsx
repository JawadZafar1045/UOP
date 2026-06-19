"use client";

import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { io } from "socket.io-client";
import { useNotificationStore } from "@/store/notificationStore";
import Loader from "@/components/ui/Loader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const accessToken = useStore((state) => state.accessToken);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect unauthenticated users — runs only on mount
  useEffect(() => {
    if (isMounted && !user) {
      router.push("/login");
    }
  }, [isMounted, user, router]);

  // Socket connection — keyed on user ID so it only opens/closes ONCE per login.
  // Previously depended on the whole `user` object which changes reference on
  // every store update, causing a new socket to be created repeatedly (memory leak).
  useEffect(() => {
    if (!user?._id || !accessToken) return;

    // Fetch notifications once on login
    useNotificationStore.getState().fetchNotifications();

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000',
      { 
        auth: { token: accessToken },
        transports: ['websocket'] // Force websocket to prevent polling 400 Bad Request behind Nginx/Proxies
      }
    );

    socket.on('notification', (notif) => {
      useNotificationStore.getState().addNotification(notif);
    });

    return () => {
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);   // ← only reconnect when the logged-in user actually changes

  if (!isMounted || !user) {
    return <Loader fullScreen size="lg" text="Authenticating..." />;
  }

  return <AppLayout>{children}</AppLayout>;
}
