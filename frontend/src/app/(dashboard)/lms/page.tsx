"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import * as lmsService from "@/services/lms.service";
import {
  Plus,
  PlayCircle,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Play,
  Compass,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/ui/Loader";

export default function LMSPage() {
  const { user } = useStore();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [continueLearning, setContinueLearning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        if (user?.role === "student") {
          const [courses, lastCourse] = await Promise.all([
            lmsService.getStudentEnrolledCourses(),
            lmsService.getStudentContinueLearning(),
          ]);
          setEnrolledCourses(Array.isArray(courses) ? courses : []);
          setContinueLearning(lastCourse);
        } else {
          // Admin / Teacher: fetch all courses
          const courses = await lmsService.getCourses();
          setEnrolledCourses(Array.isArray(courses) ? courses : []);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader size="lg" text="Loading your learning dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Student Learning Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Learner"}!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Track your video lecture progress, continue where you left off, and explore new certifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore Courses
            </Link>
            {isTeacherOrAdmin && (
              <Link
                href="/lms/admin"
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/20 transition-all"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Continue Learning Hero Card (if active learning item exists) */}
      {continueLearning && (
        <div className="bg-white rounded-3xl border border-indigo-100 p-6 sm:p-8 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-extrabold uppercase tracking-widest">
                <PlayCircle className="w-4 h-4" />
                Jump Back In
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {continueLearning.title}
              </h2>
              {continueLearning.lastLecture && (
                <p className="text-sm text-slate-500">
                  Last lecture: <strong className="text-slate-700 font-semibold">{continueLearning.lastLecture.title}</strong>
                </p>
              )}

              {/* Progress bar */}
              <div className="pt-2 max-w-md space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Overall Progress</span>
                  <span className="text-indigo-600">{continueLearning.progressPercent || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${continueLearning.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/learn/${continueLearning.slug || continueLearning._id}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Learning
            </Link>
          </div>
        </div>
      )}

      {/* Enrolled Courses Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {user?.role === "student" ? "My Enrolled Courses" : "All Managed Courses"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {user?.role === "student"
                ? "Courses you have unlocked and are currently learning."
                : "Active courses on the CSZone platform."}
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {enrolledCourses.length} {enrolledCourses.length === 1 ? "Course" : "Courses"}
          </span>
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => {
              const progress = course.progressPercent || 0;
              const completedCount = course.completedLectures || 0;
              const totalLectures = course.totalLectures || course.lectureCount || 0;

              const safeSlug = (course.slug && !course.slug.startsWith('http') && !course.slug.includes('/')) ? course.slug : course._id;

              return (
                <div
                  key={course._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-slate-100">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center text-white p-4">
                        <BookOpen className="w-8 h-8 text-indigo-300 mb-1" />
                        <span className="text-xs font-bold text-indigo-200 uppercase">CSZone</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                        {course.category || "Course"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-indigo-600 transition-colors">
                        <Link href={`/learn/${safeSlug}`}>
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {course.shortDescription || course.description}
                      </p>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">
                            {completedCount}/{totalLectures} lectures completed
                          </span>
                          <span className="text-emerald-600 font-extrabold">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/learn/${safeSlug}`}
                        className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl text-center block shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Go to Classroom
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Enrolled Courses Yet</h3>
            <p className="text-sm text-slate-500">
              Browse our course catalog to enroll in free courses or apply for certified professional training tracks.
            </p>
            <div className="pt-2">
              <Link
                href="/courses"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
              >
                Browse Course Catalog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
