"use client";

import NotificationBell from "./NotificationBell";
import { Menu } from "lucide-react";

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between lg:justify-end px-4 md:px-6 fixed top-0 right-0 left-0 lg:left-[260px] z-30">
      {/* Burger Menu for Mobile */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />
      </div>
    </header>
  );
}
