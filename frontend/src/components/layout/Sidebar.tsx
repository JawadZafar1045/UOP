"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../store/useStore";
import NiceAvatar, { genConfig } from "react-nice-avatar";

const PRESETS = [
  { name: "Avatar 1", url: "nice:peeps_1", config: genConfig({ sex: "woman", faceColor: "#F9C9B6", hairStyle: "womanShort", hairColor: "#506AF4", eyeStyle: "smile", glassesStyle: "round", noseStyle: "short", mouthStyle: "smile", shirtStyle: "hoody", shirtColor: "#9287FF", bgColor: "#E0DDFF" }) },
  { name: "Avatar 2", url: "nice:peeps_2", config: genConfig({ sex: "man", faceColor: "#F9C9B6", hairStyle: "thick", hairColor: "#D2EFF3", eyeStyle: "oval", glassesStyle: "square", noseStyle: "round", mouthStyle: "peace", shirtStyle: "short", shirtColor: "#77311D", bgColor: "#FC909F" }) },
  { name: "Avatar 3", url: "nice:peeps_3", config: genConfig({ sex: "man", faceColor: "#AC6651", hairStyle: "normal", hairColor: "#000", eyeStyle: "smile", glassesStyle: "none", noseStyle: "short", mouthStyle: "smile", shirtStyle: "polo", shirtColor: "#F4D150", bgColor: "#FFEDEF" }) },
  { name: "Avatar 4", url: "nice:peeps_4", config: genConfig({ sex: "woman", faceColor: "#AC6651", hairStyle: "womanLong", hairColor: "#000", eyeStyle: "oval", glassesStyle: "none", noseStyle: "round", mouthStyle: "peace", shirtStyle: "short", shirtColor: "#9287FF", bgColor: "#D2EFF3" }) },
  { name: "Avatar 5", url: "nice:peeps_5", config: genConfig({ sex: "man", faceColor: "#F9C9B6", hairStyle: "mohawk", hairColor: "#F48150", eyeStyle: "smile", glassesStyle: "round", noseStyle: "long", mouthStyle: "smile", shirtStyle: "hoody", shirtColor: "#F4D150", bgColor: "#E0DDFF" }) },
  { name: "Avatar 6", url: "nice:peeps_6", config: genConfig({ sex: "man", faceColor: "#AC6651", hairStyle: "thick", hairColor: "#000", eyeStyle: "oval", glassesStyle: "none", noseStyle: "short", mouthStyle: "smile", shirtStyle: "polo", shirtColor: "#77311D", bgColor: "#FFEBA4" }) },
  { name: "Avatar 7", url: "nice:peeps_7", config: genConfig({ sex: "woman", faceColor: "#F9C9B6", hairStyle: "womanShort", hatStyle: "beanie", hatColor: "#F48150", hairColor: "#000", eyeStyle: "smile", glassesStyle: "none", noseStyle: "short", mouthStyle: "peace", shirtStyle: "short", shirtColor: "#D2EFF3", bgColor: "#FFEDEF" }) },
  { name: "Avatar 8", url: "nice:peeps_8", config: genConfig({ sex: "man", faceColor: "#F9C9B6", hairStyle: "normal", hairColor: "#77311D", eyeStyle: "smile", glassesStyle: "none", noseStyle: "round", mouthStyle: "smile", shirtStyle: "hoody", shirtColor: "#506AF4", bgColor: "#D2EFF3" }) },
  { name: "Avatar 9", url: "nice:peeps_9", config: genConfig({ sex: "woman", faceColor: "#F9C9B6", hairStyle: "womanLong", hairColor: "#F48150", eyeStyle: "oval", glassesStyle: "none", noseStyle: "short", mouthStyle: "smile", shirtStyle: "polo", shirtColor: "#FFEBA4", bgColor: "#FC909F" }) },
];

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Academy", href: "/lms", icon: "🎓" },
  { name: "Documents", href: "/documents", icon: "📁" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);

  const currentTab = searchParams.get('tab') || 'all';

  useEffect(() => {
    onClose();
  }, [pathname, searchParams]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className={`w-[260px] bg-white border-r border-slate-200 h-[100dvh] fixed top-0 left-0 flex flex-col shadow-sm z-40 transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity cursor-pointer">
          <img src="/cszone-logo.png" alt="CSZone" className="h-9 w-auto object-contain" />
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
        
        {/* Admin Panel link — admin only */}
        {user?.role === 'admin' && (
          <Link
            href="/lms/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/lms/admin')
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-base">🛡️</span>
            Admin Panel
          </Link>
        )}
        
        {navItems.map((item) => {
          const isLmsMatch = item.name === 'Academy' && pathname.startsWith('/lms');
          const isActive = isLmsMatch || pathname === item.href || pathname.startsWith(item.href + '/');
          const isLmsExpanded = item.name === 'Academy' && (isActive || isLmsMatch);
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.name}
              </Link>
              
              {isLmsExpanded && (
                <div className="ml-9 mt-1 mb-2 space-y-1 border-l-2 border-slate-100 pl-2">
                  <Link 
                    href="/lms?tab=all" 
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      pathname === '/lms' && currentTab === 'all'
                        ? 'text-blue-700 font-semibold bg-blue-50/50' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    All Courses
                  </Link>
                  <Link 
                    href="/lms?tab=unlocked" 
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      pathname === '/lms' && (currentTab === 'unlocked' || currentTab === 'my')
                        ? 'text-blue-700 font-semibold bg-blue-50/50' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Courses
                  </Link>
                  <Link 
                    href="/lms/certificates" 
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      pathname.startsWith('/lms/certificates') 
                        ? 'text-blue-700 font-semibold bg-blue-50/50' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Certificates
                  </Link>
                </div>
              )}
            </div>
          );
        })}
        </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-3 group flex-1 min-w-0">
          {user?.avatar?.startsWith('nice:') ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 group-hover:border-blue-300 transition-colors flex-shrink-0 flex items-center justify-center bg-slate-50">
              <NiceAvatar style={{ width: '100%', height: '100%' }} {...(PRESETS.find(p => p.url === user.avatar)?.config || genConfig(user.avatar))} />
            </div>
          ) : user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-slate-300 group-hover:border-blue-300 transition-colors flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
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
