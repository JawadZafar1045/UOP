"use client";

import NotificationBell from "./NotificationBell";

export default function TopNav() {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-end px-6 fixed top-0 right-0 z-40" style={{ width: 'calc(100% - 260px)' }}>
      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />
      </div>
    </header>
  );
}
