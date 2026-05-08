"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "../../store/useStore";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "CRM", href: "/crm", icon: "🤝" },
  { name: "LMS", href: "/lms", icon: "🎓" },
  { name: "Employees", href: "/employees", icon: "👥" },
  { name: "Documents", href: "/documents", icon: "📁" },
  { name: "Communication", href: "/communication", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useStore(state => state.user);

  return (
    <aside className="w-[260px] bg-white border-r border-slate-200 h-screen fixed top-0 left-0 flex flex-col shadow-sm z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">U</div>
          <span className="font-semibold text-slate-800 tracking-tight text-lg">UOP Space</span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Modules</p>
        
        {navItems.filter(item => {
          if (user?.role === 'student' || user?.role === 'teacher') {
            if (item.name === 'CRM' || item.name === 'Employees') return false;
          }
          if (user?.role === 'hr') {
            if (item.name === 'CRM') return false;
          }
          return true;
        }).map((item) => {
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
      
      <Link href="/profile" className="p-4 border-t border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</p>
          </div>
        </div>
      </Link>
    </aside>
  );
}
