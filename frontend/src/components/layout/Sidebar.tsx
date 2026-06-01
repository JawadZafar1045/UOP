"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "../../store/useStore";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "LMS", href: "/lms", icon: "🎓" },
  { name: "Documents", href: "/documents", icon: "📁" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);

  useEffect(() => {
    onClose();
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className={`w-[260px] bg-white border-r border-slate-200 h-screen fixed top-0 left-0 flex flex-col shadow-sm z-40 transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">U</div>
          <span className="font-semibold text-slate-800 tracking-tight text-lg">UOP Space</span>
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Modules</p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isLmsExpanded = item.name === 'LMS' && isActive;
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.name}
              </Link>
              
              {isLmsExpanded && (
                <div className="ml-9 mt-1 mb-2 space-y-1 border-l-2 border-slate-100 pl-2">
                  <Link 
                    href="/lms" 
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${pathname === '/lms' ? 'text-blue-700 font-medium bg-blue-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    My Courses
                  </Link>
                  <Link 
                    href="/lms/certificates" 
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${pathname.startsWith('/lms/certificates') ? 'text-blue-700 font-medium bg-blue-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    Certificates
                  </Link>
                </div>
              )}
            </div>
          );
        })}
        </nav>

      {/* Admin Panel link — admin only */}
      {user?.role === 'admin' && (
        <div className="px-3 pb-2">
          <Link
            href="/lms/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/lms/admin')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-700'
            }`}
          >
            <span className="text-base">🛡️</span>
            Admin Panel
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-3 group flex-1 min-w-0">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-slate-300 group-hover:border-blue-300 transition-colors" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</p>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
          title="Sign out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
