"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import CourseCard from '@/components/ui/CourseCard';
import * as lmsService from '@/services/lms.service';
import { Search, Filter, BookOpen, Sparkles, X, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';

function CoursesCatalogContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams?.get('type') || '';
  const initialCategory = searchParams?.get('category') || '';

  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>(
    initialType === 'free' ? 'free' : initialType === 'paid' ? 'paid' : 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'All');
  const [levelFilter, setLevelFilter] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [courseRes, catRes] = await Promise.all([
          lmsService.getPublicCourses({ limit: 100 }),
          lmsService.getPublicCategories(),
        ]);
        const courseList = courseRes?.data?.data || courseRes?.data || [];
        setCourses(Array.isArray(courseList) ? courseList : []);
        setCategories(Array.isArray(catRes) ? catRes : ['Certification Bootcamp', 'Specialized Courses', 'Customized Training', 'Law Enforcement Agencies']);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter courses in memory
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Type filter
      if (typeFilter === 'free' && c.type !== 'free') return false;
      if (typeFilter === 'paid' && c.type !== 'paid') return false;

      // Category filter
      if (categoryFilter !== 'All' && c.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Level filter
      if (levelFilter !== 'All' && c.level?.toLowerCase() !== levelFilter.toLowerCase()) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesDesc = (c.description || c.shortDescription)?.toLowerCase().includes(q);
        const matchesInstructor = c.instructor?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesInstructor) return false;
      }

      return true;
    });
  }, [courses, typeFilter, categoryFilter, levelFilter, search]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('All');
    setLevelFilter('All');
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col font-sans selection:bg-[#0E8696] selection:text-white">
      <PublicNavbar />

      {/* Catalog Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-[#f4f8fb]/20 text-[#021F37] py-14 border-b border-[#d5e0e8]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d5e0e8_1px,transparent_1px),linear-gradient(to_bottom,#d5e0e8_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#eaf3f7]/50 rounded-full blur-3xl pointer-events-none animate-blob" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f8fb] text-[#0b6f7c] text-xs font-extrabold uppercase tracking-widest border border-[#d5e0e8] shadow-xs animate-fade-in-down">
            <Sparkles className="w-3.5 h-3.5 text-[#0E8696] animate-pulse-glow" />
            School of Information Security Course Library
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-3 text-[#021F37] animate-fade-in-up">
            Explore All Courses
          </h1>
          <p className="mt-3 text-[#4d6477] max-w-xl mx-auto text-sm sm:text-base animate-fade-in-up animation-delay-100">
            Discover free introductory modules and comprehensive paid training tracks led by industry experts.
          </p>
        </div>
      </section>

      {/* Main Catalog Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#d5e0e8] p-4 sm:p-6 shadow-xs mb-8 space-y-4 animate-fade-in-up animation-delay-200">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-5 h-5 text-[#5f7587] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course title, skill, or instructor..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] placeholder:text-[#5f7587] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f7587] hover:text-[#4d6477]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white text-[#021F37] shadow-xs'
                    : 'text-[#4d6477] hover:text-[#021F37]'
                }`}
              >
                All Courses
              </button>
              <button
                onClick={() => setTypeFilter('free')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'free'
                    ? 'bg-[#0b6f7c] text-white shadow-xs'
                    : 'text-[#4d6477] hover:text-[#021F37]'
                }`}
              >
                Free Only
              </button>
              <button
                onClick={() => setTypeFilter('paid')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'paid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-[#4d6477] hover:text-[#021F37]'
                }`}
              >
                Paid Tracks
              </button>
            </div>
          </div>

          {/* Category & Level Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <span className="font-bold text-[#5f7587] uppercase tracking-wider text-[11px]">Filters:</span>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-lg text-[#021F37] font-semibold text-xs focus:outline-none focus:border-[#0E8696] cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-lg text-[#021F37] font-semibold text-xs focus:outline-none focus:border-[#0E8696] cursor-pointer"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {(search || typeFilter !== 'all' || categoryFilter !== 'All' || levelFilter !== 'All') && (
              <button
                onClick={resetFilters}
                className="text-[#0E8696] hover:text-[#0b6f7c] font-bold ml-auto flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-[#4d6477]">
            Showing <strong className="text-[#021F37]">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? 'course' : 'courses'}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-96 border border-[#d5e0e8] shadow-xs" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#d5e0e8] p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#5f7587] mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#021F37]">No matching courses found</h3>
            <p className="text-[#4d6477] text-sm mt-1 mb-6">
              Try adjusting your search criteria or reset filters to see all available programs.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-[#0b6f7c] hover:bg-[#021F37] text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center"><Loader size="lg" text="Loading courses..." /></div>}>
      <CoursesCatalogContent />
    </Suspense>
  );
}
