"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { GraduationCap, Menu, X, ArrowRight, User, BookOpen, LogOut } from 'lucide-react';

export default function PublicNavbar() {
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#d5e0e8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center group">
            <img
              src="/SIS-logo.png"
              alt="School of Information Security"
              className="h-10 md:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation (Only shown when not logged in) */}
          {!user && (
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/courses" className="text-xs sm:text-sm font-bold text-[#4d6477] hover:text-[#0E8696] transition-colors">
                Explore Courses
              </Link>
              <Link href="/courses?type=free" className="text-xs sm:text-sm font-bold text-[#4d6477] hover:text-[#0E8696] transition-colors">
                Free Courses
              </Link>
              <Link href="/courses?type=paid" className="text-xs sm:text-sm font-bold text-[#4d6477] hover:text-[#0E8696] transition-colors">
                Professional Tracks
              </Link>
            </nav>
          )}

          {/* Desktop User / Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/lms"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#021F37] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <BookOpen className="w-4 h-4 text-[#0E8696]" />
                  My Courses
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/lms/admin"
                    className="px-3.5 py-2 text-xs font-bold text-[#0b6f7c] bg-[#f4f8fb] border border-[#d5e0e8] hover:bg-[#eaf3f7] rounded-xl transition-all"
                  >
                    🛡️ Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-2 border-l border-[#d5e0e8]">
                  <span className="text-xs font-bold text-[#021F37] max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-[#5f7587] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                  className="px-4 py-2 text-xs font-bold text-[#021F37] hover:text-[#0E8696] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0b6f7c] hover:bg-[#021F37] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
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
            className="md:hidden p-2.5 text-[#4d6477] hover:text-[#021F37] rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d5e0e8] bg-white px-4 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {!user && (
            <nav className="flex flex-col space-y-3">
              <Link
                href="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-[#021F37] hover:text-[#0E8696] px-2 py-1.5 rounded-lg"
              >
                Explore Courses
              </Link>
              <Link
                href="/courses?type=free"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-[#021F37] hover:text-[#0E8696] px-2 py-1.5 rounded-lg"
              >
                Free Courses
              </Link>
              <Link
                href="/courses?type=paid"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-[#021F37] hover:text-[#0E8696] px-2 py-1.5 rounded-lg"
              >
                Professional Tracks
              </Link>
            </nav>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {user ? (
              <>
                <div className="text-sm font-semibold text-[#021F37] px-2">
                  Signed in as <span className="text-[#0E8696]">{user.name}</span>
                </div>
                <Link
                  href="/lms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-[#0E8696] text-white font-bold rounded-xl shadow-xs hover:bg-[#0b6f7c] transition-all"
                >
                  Go to My Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/lms/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 bg-[#f4f8fb] text-[#0b6f7c] font-bold rounded-xl border border-[#d5e0e8] text-sm"
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
                  className="w-full text-center py-2.5 text-[#021F37] font-bold border border-[#d5e0e8] rounded-xl hover:bg-[#f4f8fb] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-[#0E8696] hover:bg-[#0b6f7c] text-white font-bold rounded-xl shadow-sm transition-all"
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
