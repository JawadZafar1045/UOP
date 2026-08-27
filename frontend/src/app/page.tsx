"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import CourseCard from '@/components/ui/CourseCard';
import * as lmsService from '@/services/lms.service';
import {
  ArrowRight,
  Shield,
  Terminal,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  Search,
  Check,
  Users,
  Compass,
  FileCheck
} from 'lucide-react';

const CATEGORIES = [
  { name: 'All Tracks', filter: '', icon: Layers },
  { name: 'Certification Bootcamp', filter: 'Certification Bootcamp', icon: Award },
  { name: 'Specialized Courses', filter: 'Specialized Courses', icon: BookOpen },
  { name: 'Customized Training', filter: 'Customized Training', icon: Compass },
  { name: 'Law Enforcement Agencies', filter: 'Law Enforcement Agencies', icon: Shield },
];

export default function HomePage() {
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const allRes = await lmsService.getPublicCourses({ limit: 12, category: selectedCategory || undefined });
        const allList = allRes?.data?.data || allRes?.data || [];
        setAllCourses(Array.isArray(allList) ? allList : []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedCategory]);

  const filteredCourses = allCourses.filter(c =>
    !searchQuery ? true : (
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-blue-50/30 text-slate-900 pt-16 pb-24 md:pt-24 md:pb-32 border-b border-slate-200">
        {/* Subtle executive background accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-100/60 blur-[120px] pointer-events-none rounded-full animate-blob" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Executive Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs animate-fade-in-down hover:border-blue-300 transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse-glow" />
            Practical Cybersecurity & Engineering Academy
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.12] text-slate-900 animate-fade-in-up">
            Master Practical Skills for <span className="text-blue-600">Real-World Tech Careers</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal animate-fade-in-up animation-delay-100">
            Hands-on training, recorded lecture curriculum, and verifiable certifications. Built by active CSZone cybersecurity practitioners and software engineers.
          </p>

          {/* Search & Action Bar */}
          <div className="mt-10 max-w-2xl mx-auto space-y-4 animate-fade-in-up animation-delay-200">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-2 shadow-lg shadow-slate-200/60 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ethical Hacking, Web Dev, Cloud..."
                className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <Link
                href="/courses"
                className="group px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer hover:shadow-md"
              >
                Browse All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/courses?type=free"
                className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl shadow-xs active:scale-95"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse-glow" />
                Explore Free Courses
              </Link>
              <Link
                href="/courses?type=paid"
                className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl shadow-xs active:scale-95"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Professional Certification Tracks
              </Link>
            </div>
          </div>

          {/* Stats & Trust Metric Bar */}
          <div className="mt-16 pt-10 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left animate-fade-in-up animation-delay-300">
            {[
              { title: '100% Practical', desc: 'Real-world scenario labs' },
              { title: 'Free & Pro Tracks', desc: 'Accessible learning model' },
              { title: 'Active Mentorship', desc: 'Industry expert curriculum' },
              { title: 'Verified Credentials', desc: 'Tamper-proof certificates' },
            ].map((point, i) => (
              <div key={i} className="group flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-blue-300 transition-all duration-300">
                <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{point.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Category Pills & All Courses Catalog Preview */}
      <section className="py-20 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Course Catalog
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              Select a specialized track to discover comprehensive recorded lectures and modules.
            </p>

            {/* Category Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.filter;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.filter)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 scale-105'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 shadow-xs hover:-translate-y-0.5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-96 border border-slate-200" />
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Courses Matching Filter</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Try selecting another category or clear your search term.</p>
              <button
                onClick={() => { setSelectedCategory(''); setSearchQuery(''); }}
                className="text-blue-600 font-bold text-xs hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* Catalog CTA */}
          <div className="mt-14 text-center">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all"
            >
              Browse Complete Catalog
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* Why CSZone Section - 3 Pillar Feature */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">The CSZone Standard</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Why Learn with CSZone?
            </h2>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              We focus strictly on production-level technical execution rather than abstract theory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">Hands-on Lab Environments</h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Practice penetration testing, secure coding, and server architecture in actual simulated environments.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">Verifiable Digital Certificates</h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Each certificate issued by CSZone features an authentic verification code and public certificate verification lookup.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">Practitioner Mentorship</h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Direct guidance from working security researchers and developers through streamlined course module discussions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Conversion Banner */}
      <section className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 text-slate-900 py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Ready to upgrade your technical capabilities?
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
            Create an account today and get immediate access to free tracks and structured video classrooms.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 hover:shadow-xl transition-all cursor-pointer"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}