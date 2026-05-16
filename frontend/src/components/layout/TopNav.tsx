"use client";

import { useStore } from "../../store/useStore";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

export default function TopNav() {
  const logout = useStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // or wherever the login route is
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 fixed top-0 right-0 z-40" style={{ width: 'calc(100% - 260px)' }}>
      {/* Search */}
      <div className="flex items-center flex-1">
        <div className="relative w-96">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search across platform..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
