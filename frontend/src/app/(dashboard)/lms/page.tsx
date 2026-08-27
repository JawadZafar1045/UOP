"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  AlertCircle,
  Lock,
  Shield,
  Layers,
  Sparkle
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/ui/Loader";

function LMSContent() {
  const { user } = useStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");

  const [courses, setCourses] = useState<any[]>([]);
  const [continueLearning, setContinueLearning] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<"all" | "unlocked" | "locked">(
    tabParam === "unlocked" || tabParam === "my"
      ? "unlocked"
      : tabParam === "locked"
      ? "locked"
      : "all"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    if (tabParam === "unlocked" || tabParam === "my") {
      setFilterTab("unlocked");
    } else if (tabParam === "locked") {
      setFilterTab("locked");
    } else {
      setFilterTab("all");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "all" | "unlocked" | "locked") => {
    setFilterTab(tab);
    router.replace(`/lms?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        if (user?.role === "student") {
          const [allCourses, lastCourse] = await Promise.all([
            lmsService.getStudentEnrolledCourses(),
            lmsService.getStudentContinueLearning(),
          ]);
          setCourses(Array.isArray(allCourses) ? allCourses : []);
          setContinueLearning(lastCourse);
        } else {
          // Admin / Teacher: fetch all courses
          const allCourses = await lmsService.getCourses();
          setCourses(Array.isArray(allCourses) ? allCourses : []);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const unlockedCourses = courses.filter((c) => !c.isLocked);
  const lockedCourses = courses.filter((c) => !!c.isLocked);

  const displayedCourses =
    filterTab === "unlocked"
      ? unlockedCourses
      : filterTab === "locked"
      ? lockedCourses
      : courses;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader size="lg" text="Loading your learning dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Header Banner - Bright Executive Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 text-slate-900 shadow-xs">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[250px] bg-blue-100/50 blur-[90px] pointer-events-none rounded-full animate-blob" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider shadow-xs animate-fade-in-down">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse-glow" />
              Student Learning Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 animate-fade-in-up">
              Welcome back, {user?.name || "Learner"}!
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl animate-fade-in-up animation-delay-100">
              Access your enrolled training tracks, track video progress, and explore specialized cybersecurity certifications.
            </p>
          </div>

          <div className="flex items-center gap-3 animate-fade-in-up animation-delay-200">
            {user?.role === "student" && (
              <button
                onClick={() => handleTabChange(filterTab === "all" ? "unlocked" : "all")}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {filterTab === "all" ? (
                  <>
                    <BookOpen className="w-4 h-4" />
                    View My Enrolled ({unlockedCourses.length})
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    View All Courses ({courses.length})
                  </>
                )}
              </button>
            )}
            {isTeacherOrAdmin && (
              <Link
                href="/lms/admin"
                className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Continue Learning Hero Card (if active learning item exists) */}
      {continueLearning && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden animate-fade-in-up animation-delay-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-extrabold uppercase tracking-widest">
                <PlayCircle className="w-4 h-4 animate-pulse-glow" />
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
                  <span className="text-blue-600">{continueLearning.progressPercent || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${continueLearning.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/learn/${continueLearning.slug || continueLearning._id}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-xs hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Learning
            </Link>
          </div>
        </div>
      )}

      {/* Courses Section with Tabs */}
      <div className="space-y-6 animate-fade-in-up animation-delay-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {user?.role === "student"
                ? filterTab === "unlocked"
                  ? "My Enrolled Courses"
                  : filterTab === "locked"
                  ? "Locked Pro Tracks"
                  : "All Courses"
                : "All Managed Courses"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {user?.role === "student"
                ? filterTab === "unlocked"
                  ? "Courses you have unlocked and are currently learning."
                  : filterTab === "locked"
                  ? "Specialized professional tracks available for admission."
                  : "Explore all available certification tracks, interactive lectures, and training modules."
                : "Active courses on the CSZone platform."}
            </p>
          </div>

          {/* Student Filter Tabs */}
          {user?.role === "student" && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => handleTabChange("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Courses ({courses.length})
              </button>
              <button
                onClick={() => handleTabChange("unlocked")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterTab === "unlocked"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Enrolled ({unlockedCourses.length})
              </button>
              {lockedCourses.length > 0 && (
                <button
                  onClick={() => handleTabChange("locked")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterTab === "locked"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  Locked Tracks ({lockedCourses.length})
                </button>
              )}
            </div>
          )}
        </div>

        {displayedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course) => {
              const isLocked = !!course.isLocked;
              const progress = course.progressPercent || 0;
              const completedCount = course.completedLectures || 0;
              const totalLectures = course.totalLectures || course.lectureCount || 0;
              const isPending = course.registrationStatus === "pending";

              const safeSlug = (course.slug && !course.slug.startsWith("http") && !course.slug.includes("/"))
                ? course.slug
                : course._id;

              return (
                <div
                  key={course._id}
                  className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    isLocked
                      ? "border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md"
                      : "border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5"
                  }`}
                >
                  {/* Thumbnail Stage */}
                  <div className="relative aspect-video w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isLocked ? "filter brightness-90 group-hover:scale-105" : "group-hover:scale-105"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100/60 flex flex-col items-center justify-center text-slate-700 p-4 relative select-none">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:1.25rem_1.25rem] opacity-35" />
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 mb-1 group-hover:scale-110 group-hover:rotate-2 transition-all duration-300 relative z-10">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider relative z-10">CSZone</span>
                      </div>
                    )}

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-slate-900/90 text-white shadow-xs backdrop-blur-sm border border-slate-700">
                          <Lock className="w-3 h-3 text-amber-400" />
                          LOCKED • PRO TRACK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-blue-100" />
                          UNLOCKED
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 shadow-xs">
                        {course.category || "General"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-blue-600 transition-colors">
                        <Link href={isLocked ? `/courses/${safeSlug}` : `/learn/${safeSlug}`}>
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {course.shortDescription || course.description}
                      </p>
                    </div>

                    {/* Action & Progress Footer */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      {isLocked ? (
                        /* Locked Course Details & Unlock CTA */
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Tuition</span>
                            <span className="font-black text-slate-900 text-sm">
                              {course.currency || "PKR"} {(course.price || 0).toLocaleString()}
                            </span>
                          </div>

                          {isPending ? (
                            <Link
                              href={`/courses/${safeSlug}`}
                              className="w-full py-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              Waiting for approval from admin
                            </Link>
                          ) : (
                            <Link
                              href={`/courses/${safeSlug}`}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center block shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Unlock Course / Register
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        /* Unlocked / Enrolled Course Progress & Classroom Link */
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-500">
                                {completedCount}/{totalLectures} lectures completed
                              </span>
                              <span className="text-blue-600 font-extrabold">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <Link
                            href={`/learn/${safeSlug}`}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl text-center block shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Go to Classroom
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Courses Found</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {filterTab === "unlocked"
                ? "You have not enrolled in any courses yet."
                : "No courses currently match the selected filter."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleTabChange("all")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                View All Courses
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function LMSPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader size="lg" text="Loading courses..." />
        </div>
      }
    >
      <LMSContent />
    </Suspense>
  );
}
