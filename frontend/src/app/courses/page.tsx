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
        setCategories(Array.isArray(catRes) ? catRes : ['Cyber Security', 'Web Development', 'Mobile Development', 'DevOps', 'Artificial Intelligence']);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      {/* Catalog Header */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-14 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
            CSZone Course Library
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-2 text-white">
            Explore All Courses
          </h1>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Discover free introductory modules and comprehensive paid training tracks led by industry experts.
          </p>
        </div>
      </section>

      {/* Main Catalog Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course title, skill, or instructor..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Courses
              </button>
              <button
                onClick={() => setTypeFilter('free')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'free'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Free Only
              </button>
              <button
                onClick={() => setTypeFilter('paid')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'paid'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid Tracks
              </button>
            </div>
          </div>

          {/* Category & Level Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Filters:</span>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
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
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {(search || typeFilter !== 'all' || categoryFilter !== 'All' || levelFilter !== 'All') && (
              <button
                onClick={resetFilters}
                className="text-indigo-600 hover:text-indigo-700 font-bold ml-auto flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-600">
            Showing <strong className="text-slate-900">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? 'course' : 'courses'}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-96 border border-slate-200/80 shadow-xs" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No matching courses found</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">
              Try adjusting your search criteria or reset filters to see all available programs.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader size="lg" text="Loading courses..." /></div>}>
      <CoursesCatalogContent />
    </Suspense>
  );
}
