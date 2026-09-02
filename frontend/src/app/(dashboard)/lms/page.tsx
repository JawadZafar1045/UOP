"use client";

import { useEffect, useMemo, useState } from "react";
import { useLmsStore } from "@/store/lmsStore";
import { useStore } from "@/store/useStore";
import {
  Plus,
  PlayCircle,
  BookOpen,
  Users,
  ArrowRight,
  AlertCircle,
  Sparkles,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/ui/Loader";

export default function LMSPage() {
  const { courses, isLoading, error, fetchCourses } = useLmsStore();
  const { user } = useStore();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const visibleCourses = useMemo(() => {
    if (!courses) return [];
    if (user?.role !== 'student') return courses;

    return courses.filter(course => {
      const studentsList = course.students || course.enrolledStudents;
      if (!studentsList || !Array.isArray(studentsList)) return false;
      return studentsList.some(
        s => s === user._id ||
             s?._id === user._id ||
             s?.toString() === user._id
      );
    });
  }, [courses, user]);

  const handlePublishCourse = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Publish this course? It will become visible to students.")) return;
    setPublishingId(courseId);
    try {
      const { updateCourse } = useLmsStore.getState();
      await updateCourse(courseId, { status: "active" });
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingId(null);
    }
  };

  if (user?.role === 'student' && visibleCourses.length === 0 && !isLoading && !error) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🎓</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Majors Yet
        </h3>
        <p className="text-gray-500 text-sm">
          You are not enrolled in any majors.
          Contact your teacher or admin to get enrolled.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50/30">
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Elevated Hero Header */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-900/5">
          {/* Abstract Background */}
          <div className="absolute inset-0 overflow-hidden">
            <svg
              className="absolute w-full h-full"
              viewBox="0 0 1200 300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id="hero-clip">
                  <rect width="1200" height="300" />
                </clipPath>
              </defs>

              <g clipPath="url(#hero-clip)">
                {/* Dot grid */}
                {Array.from({ length: 12 }).map((_, row) =>
                  Array.from({ length: 28 }).map((_, col) => (
                    <circle
                      key={`${row}-${col}`}
                      cx={col * 46 + 23}
                      cy={row * 28 + 14}
                      r="1.5"
                      fill="#81C784"
                      opacity="0.25"
                    />
                  )),
                )}

                {/* Radial rings top-right */}
                <circle
                  cx="1080"
                  cy="60"
                  r="90"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="0.8"
                  opacity="0.25"
                />
                <circle
                  cx="1080"
                  cy="60"
                  r="130"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="0.6"
                  opacity="0.15"
                />
                <circle
                  cx="1080"
                  cy="60"
                  r="170"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="0.5"
                  opacity="0.10"
                />

                {/* Soft radial bloom bottom-left */}
                <circle
                  cx="120"
                  cy="240"
                  r="70"
                  fill="#C8E6C9"
                  opacity="0.20"
                />
                <circle
                  cx="120"
                  cy="240"
                  r="110"
                  fill="none"
                  stroke="#81C784"
                  strokeWidth="0.6"
                  opacity="0.15"
                />

                {/* Node graph — top-right cluster */}
                <line x1="920" y1="40" x2="1010" y2="80" stroke="#2E7D32" strokeWidth="0.8" opacity="0.35" />
                <line x1="1010" y1="80" x2="1090" y2="55" stroke="#2E7D32" strokeWidth="0.8" opacity="0.35" />
                <line x1="1010" y1="80" x2="1020" y2="150" stroke="#2E7D32" strokeWidth="0.8" opacity="0.25" />
                <line x1="1090" y1="55" x2="1140" y2="110" stroke="#2E7D32" strokeWidth="0.7" opacity="0.25" />
                <line x1="1020" y1="150" x2="1100" y2="170" stroke="#2E7D32" strokeWidth="0.7" opacity="0.20" />
                <line x1="920" y1="40" x2="860" y2="100" stroke="#2E7D32" strokeWidth="0.7" opacity="0.20" />

                <circle cx="920" cy="40" r="5" fill="#2E7D32" opacity="0.55" />
                <circle cx="1010" cy="80" r="7" fill="#2E7D32" opacity="0.60" />
                <circle cx="1090" cy="55" r="5" fill="#2E7D32" opacity="0.50" />
                <circle cx="1140" cy="110" r="4" fill="#66BB6A" opacity="0.45" />
                <circle cx="1020" cy="150" r="5" fill="#2E7D32" opacity="0.45" />
                <circle cx="1100" cy="170" r="3.5" fill="#66BB6A" opacity="0.35" />
                <circle cx="860" cy="100" r="3.5" fill="#81C784" opacity="0.40" />

                {/* Pulse rings on anchor node */}
                <circle cx="1010" cy="80" r="16" fill="none" stroke="#2E7D32" strokeWidth="0.6" opacity="0.25" />
                <circle cx="1010" cy="80" r="26" fill="none" stroke="#2E7D32" strokeWidth="0.5" opacity="0.15" />

                {/* Node graph — bottom-left scatter */}
                <line x1="80" y1="180" x2="180" y2="210" stroke="#2E7D32" strokeWidth="0.7" opacity="0.25" />
                <line x1="180" y1="210" x2="260" y2="190" stroke="#2E7D32" strokeWidth="0.7" opacity="0.25" />
                <line x1="80" y1="180" x2="100" y2="260" stroke="#2E7D32" strokeWidth="0.6" opacity="0.20" />
                <line x1="260" y1="190" x2="320" y2="240" stroke="#2E7D32" strokeWidth="0.6" opacity="0.18" />

                <circle cx="80" cy="180" r="4.5" fill="#2E7D32" opacity="0.45" />
                <circle cx="180" cy="210" r="6" fill="#2E7D32" opacity="0.50" />
                <circle cx="260" cy="190" r="4" fill="#2E7D32" opacity="0.40" />
                <circle cx="100" cy="260" r="3.5" fill="#66BB6A" opacity="0.35" />
                <circle cx="320" cy="240" r="3" fill="#81C784" opacity="0.35" />

                {/* Decorative rotated rect accent */}
                <rect x="430" y="20" width="22" height="22" rx="4" fill="#C8E6C9" opacity="0.45" transform="rotate(20 441 31)" />
                <rect x="700" y="240" width="16" height="16" rx="3" fill="#E8F5E9" opacity="0.40" transform="rotate(-15 708 248)" />
              </g>
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-4">
                  <GraduationCap className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-green-700 tracking-wide uppercase">
                    Learning Hub
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3">
                  {isTeacherOrAdmin
                    ? "Major Management"
                    : "My Learning Journey"}
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                  {isTeacherOrAdmin
                    ? "Create, manage, and track educational content. Empower learners with engaging major subjects and courses."
                    : "Continue your educational journey. Access your enrolled majors and track your progress."}
                </p>

                {/* Quick Stats for Teacher/Admin */}
                {isTeacherOrAdmin && (
                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm font-semibold text-slate-700">
                        {courses.length} Major{courses.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-semibold text-slate-700">
                        {
                          courses.filter(
                            (c) =>
                              c.status === "active",
                          ).length
                        }{" "}
                        Published
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-semibold text-slate-700">
                        {courses.reduce(
                          (sum, c) => sum + (c.enrolledStudents?.length || 0),
                          0,
                        )}{" "}
                        Students
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {isTeacherOrAdmin && (
                  <Link href="/lms/courses/new">
                    <button className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:bg-green-800 transition-all duration-200 active:scale-[0.98] border border-green-600/20">
                      <Plus className="w-5 h-5" />
                      Create New Major
                      <Sparkles className="w-4 h-4 ml-1" />
                    </button>
                  </Link>
                )}
                <Link href="/lms/programs">
                  <button className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/80 backdrop-blur border border-green-200 text-green-700 text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-green-50 transition-all duration-200 active:scale-[0.98]">
                    <GraduationCap className="w-5 h-5" />
                    Academic Structure
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader size="lg" text="Loading majors..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-600 font-medium mb-6">{error}</p>
            <button
              onClick={() => fetchCourses()}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-green-400 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/10 border border-green-100">
                <BookOpen className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3">
              No majors yet
            </h3>
            <p className="text-slate-500 text-lg max-w-md leading-relaxed mb-8">
              {isTeacherOrAdmin
                ? "Start your teaching journey. Create engaging majors and share your expertise with learners worldwide."
                : "Your learning adventure awaits. Enroll in majors to unlock new skills and knowledge."}
            </p>
            {isTeacherOrAdmin && (
              <Link href="/lms/courses/new">
                <button className="flex items-center gap-2 px-8 py-4 bg-green-700 text-white text-base font-bold rounded-xl hover:bg-green-800 shadow-xl shadow-green-500/30 transition-all active:scale-[0.98]">
                  <Plus className="w-5 h-5" />
                  Create Your First Major
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {user?.role === 'teacher' ? 'My Majors' :
                   user?.role === 'admin'   ? 'All Majors' :
                                              'My Enrolled Majors'}
                </h2>
                <p className="text-slate-500 mt-1">
                  {visibleCourses.length} major{visibleCourses.length !== 1 ? "s" : ""}{" "}
                  available
                </p>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCourses.map((course) => (
                <Link
                  href={`/lms/courses/${course._id}`}
                  key={course._id}
                  className="group"
                >
                  <div className="bg-white rounded-2xl border border-slate-200/60 hover:border-green-200 shadow-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 overflow-hidden flex flex-col h-full">
                    {/* Enhanced Thumbnail */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      {course.thumbnail ? (
                        <>
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-green-50 flex items-center justify-center relative overflow-hidden">
                          {/* Abstract Pattern */}
                          <svg
                            className="absolute inset-0 w-full h-full opacity-40"
                            viewBox="0 0 400 300"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="80" cy="60" r="60" fill="#2E7D32" opacity="0.1" />
                            <circle cx="320" cy="240" r="70" fill="#66BB6A" opacity="0.08" />
                            <rect x="280" y="40" width="40" height="40" rx="6" fill="#43A047" opacity="0.12" />
                          </svg>
                          <PlayCircle className="w-16 h-16 text-green-300 relative z-10 group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
                        </div>
                      )}

                      {/* Elevated Status Badge & Featured Tag */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                        {course.featuredOnHomepage && (
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg bg-amber-500/95 text-white border border-amber-300/50 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Featured
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-lg backdrop-blur-xl border-2 ${
                            course.status === "active"
                              ? "bg-emerald-500/95 text-white border-emerald-300/50"
                              : "bg-slate-700/95 text-white border-slate-500/50"
                          }`}
                        >
                          {course.status === "active"
                            ? "PUBLISHED"
                            : course.status?.toUpperCase() || "DRAFT"}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <div className="flex items-center gap-2 text-white font-semibold text-sm">
                          <span>View Course</span>
                          <ArrowRight className="w-4 h-4 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Content Section */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-xl leading-snug mb-3 group-hover:text-green-700 transition-colors duration-200 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                          {course.description ||
                            "Comprehensive course designed to help you master new skills and achieve your learning goals."}
                        </p>
                      </div>

                      {/* Enhanced Footer */}
                      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">
                              Enrolled
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {course.enrolledStudents?.length || 0}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isTeacherOrAdmin && course.status === "draft" && (
                            <button
                              onClick={(e) => handlePublishCourse(e, course._id)}
                              disabled={publishingId === course._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-[0.95] disabled:opacity-50"
                            >
                              {publishingId === course._id
                                ? <><Loader size="sm" /> Publishing...</>
                                : <><CheckCircle2 className="w-3.5 h-3.5" /> Publish</>}
                            </button>
                          )}
                          <div className="flex items-center gap-1.5 text-green-700 font-bold text-sm group/btn">
                            <span className="hidden sm:inline">
                              {isTeacherOrAdmin ? "Manage" : "Continue"}
                            </span>
                            <ArrowRight className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}