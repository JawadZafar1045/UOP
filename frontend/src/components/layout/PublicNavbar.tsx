"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { GraduationCap, Menu, X, ArrowRight, User, BookOpen, LogOut } from 'lucide-react';

export default function PublicNavbar() {
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center group">
            <img
              src="/cszone-logo.png"
              alt="CSZone"
              className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Explore Courses
            </Link>
            <Link href="/courses?type=free" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Free Courses
            </Link>
            <Link href="/courses?type=paid" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Professional Tracks
            </Link>
          </nav>

          {/* Desktop User / Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/lms"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  My Courses
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/lms/admin"
                    className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-all"
                  >
                    🛡️ Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-indigo-600 px-2 py-1.5 rounded-lg"
            >
              Explore Courses
            </Link>
            <Link
              href="/courses?type=free"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-indigo-600 px-2 py-1.5 rounded-lg"
            >
              Free Courses
            </Link>
            <Link
              href="/courses?type=paid"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-indigo-600 px-2 py-1.5 rounded-lg"
            >
              Professional Tracks
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {user ? (
              <>
                <div className="text-sm font-semibold text-slate-800 px-2">
                  Signed in as <span className="text-indigo-600">{user.name}</span>
                </div>
                <Link
                  href="/lms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Go to My Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/lms/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-sm"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2 text-red-600 font-medium text-sm hover:bg-red-50 rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-slate-700 font-bold border border-slate-200 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Get Started for Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
