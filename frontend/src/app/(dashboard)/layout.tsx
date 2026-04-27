"use client";

import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!user) {
      router.push("/login");
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
