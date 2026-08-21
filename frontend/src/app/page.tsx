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
  Code2,
  Terminal,
  Cpu,
  Sparkles,
  BookOpen,
  Award,
  Lock,
  Layers,
  Search,
  Check,
  Users,
  Compass,
  FileCheck
} from 'lucide-react';

const CATEGORIES = [
  { name: 'All Tracks', filter: '', icon: Layers },
  { name: 'Cyber Security', filter: 'Cyber Security', icon: Shield },
  { name: 'Web Development', filter: 'Web Development', icon: Code2 },
  { name: 'Cloud & Systems', filter: 'Mobile Development', icon: Terminal },
  { name: 'DevOps & Architecture', filter: 'DevOps', icon: Cpu },
];

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const [featuredRes, allRes] = await Promise.all([
          lmsService.getPublicCourses({ featured: true, limit: 3 }),
          lmsService.getPublicCourses({ limit: 9, category: selectedCategory || undefined }),
        ]);

        const featList = featuredRes?.data?.data || featuredRes?.data || [];
        const allList = allRes?.data?.data || allRes?.data || [];

        setFeaturedCourses(Array.isArray(featList) ? featList : []);
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
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-24 md:pt-24 md:pb-32 border-b border-slate-800">
        {/* Subtle executive background accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Executive Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Practical Cybersecurity & Engineering Academy
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.12] text-slate-100">
            Master Practical Skills for <span className="text-blue-400">Real-World Tech Careers</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Hands-on training, recorded lecture curriculum, and verifiable certifications. Built by active CSZone cybersecurity practitioners and software engineers.
          </p>

          {/* Search & Action Bar */}
          <div className="mt-10 max-w-2xl mx-auto space-y-4">
            <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-blue-500 transition-colors">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ethical Hacking, Web Dev, Cloud..."
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <Link
                href="/courses"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                Browse All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/courses?type=free"
                className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Explore Free Courses
              </Link>
              <Link
                href="/courses?type=paid"
                className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Professional Certification Tracks
              </Link>
            </div>
          </div>

          {/* Stats & Trust Metric Bar */}
          <div className="mt-16 pt-10 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            {[
              { title: '100% Practical', desc: 'Real-world scenario labs' },
              { title: 'Free & Pro Tracks', desc: 'Accessible learning model' },
              { title: 'Active Mentorship', desc: 'Industry expert curriculum' },
              { title: 'Verified Credentials', desc: 'Tamper-proof certificates' },
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{point.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Featured Programs Section */}
      {featuredCourses.length > 0 && (
        <section className="py-24 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Curated High-Impact Curriculum
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Featured Certification Tracks
                </h2>
                <p className="text-slate-600 text-sm max-w-xl">
                  Comprehensive career roadmaps built to take you from foundational concepts to advanced practical execution.
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-bold transition-all border border-slate-200 hover:border-blue-200 cursor-pointer shrink-0"
              >
                View all courses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

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
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
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
              className="inline-flex items-center gap-2 px-7 py-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Browse Complete Catalog
              <ArrowRight className="w-4 h-4" />
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
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mb-6">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hands-on Lab Environments</h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Practice penetration testing, secure coding, and server architecture in actual simulated environments.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mb-6">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verifiable Digital Certificates</h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Each certificate issued by CSZone features an authentic verification code and public certificate verification lookup.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mb-6">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Practitioner Mentorship</h3>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Direct guidance from working security researchers and developers through streamlined course module discussions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Conversion Banner */}
      <section className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to upgrade your technical capabilities?
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
            Create an account today and get immediate access to free tracks and structured video classrooms.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}