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
  Layers,
  FolderTree,
  FileText,
  Video,
  Award,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Send,
  X
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import * as lmsService from "@/services/lms.service";

interface GroupedMajor {
  id: string;
  name: string;
  code?: string;
  description?: string;
  courses: any[];
}

interface GroupedProgram {
  id: string;
  name: string;
  code?: string;
  school?: string;
  faculty?: string;
  degreeLevel?: string;
  majors: GroupedMajor[];
}

export default function LMSPage() {
  const { courses, isLoading, error, fetchCourses } = useLmsStore();
  const { user } = useStore();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedMajorFilter, setSelectedMajorFilter] = useState<string>("all");
  const [enrolledPrograms, setEnrolledPrograms] = useState<any[]>([]);
  const [isProgramsLoading, setIsProgramsLoading] = useState(true);

  // Course Catalog & Applications for Students
  const [studentViewTab, setStudentViewTab] = useState<"enrolled" | "explore" | "requests">("enrolled");
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [exploreSearch, setExploreSearch] = useState("");
  const [applyingCourse, setApplyingCourse] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    fetchCourses();
    setIsProgramsLoading(true);
    lmsService.getPrograms()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          setEnrolledPrograms(list);
        } else if (user?.programId) {
          lmsService.getProgramById(user.programId)
            .then(p => {
              if (p) setEnrolledPrograms([p]);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (user?.programId) {
          lmsService.getProgramById(user.programId)
            .then(p => {
              if (p) setEnrolledPrograms([p]);
            })
            .catch(() => {});
        }
      })
      .finally(() => {
        setIsProgramsLoading(false);
      });
  }, [fetchCourses, user?.programId]);

  const loadCatalogAndRequests = async () => {
    if (user?.role !== "student") return;
    setIsCatalogLoading(true);
    try {
      const [cat, reqs] = await Promise.all([
        lmsService.getCoursesCatalog().catch(() => []),
        lmsService.getMyEnrollmentRequests().catch(() => []),
      ]);
      setCatalogCourses(Array.isArray(cat) ? cat : (cat?.data || []));
      setMyRequests(Array.isArray(reqs) ? reqs : (reqs?.data || []));
    } catch (err) {
      console.error("Failed to load catalog or student requests:", err);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "student") {
      loadCatalogAndRequests();
    }
  }, [user?.role]);

  const handleApplyCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingCourse) return;
    setIsApplying(true);
    try {
      await lmsService.applyCourseEnrollment(applyingCourse._id, applicationMessage);
      await loadCatalogAndRequests();
      setApplyingCourse(null);
      setApplicationMessage("");
      alert("Course application submitted successfully! Your administrator has been notified for approval.");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to submit course application");
    } finally {
      setIsApplying(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!exploreSearch.trim()) return catalogCourses;
    const q = exploreSearch.toLowerCase();
    return catalogCourses.filter((c: any) =>
      c.title?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.courseCode?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.faculty?.toLowerCase().includes(q) ||
      c.school?.toLowerCase().includes(q) ||
      c.instructor?.name?.toLowerCase().includes(q) ||
      c.programId?.name?.toLowerCase().includes(q) ||
      c.majorId?.name?.toLowerCase().includes(q)
    );
  }, [catalogCourses, exploreSearch]);

  const visibleCourses = useMemo(() => {
    if (!courses) return [];
    if (user?.role !== 'student') return courses;

    const userProgIds = [String(user?.programId || '')];
    if (Array.isArray(user?.enrolledPrograms)) {
      user.enrolledPrograms.forEach((p: any) => userProgIds.push(String(p?._id || p)));
    }

    return courses.filter(course => {
      const studentsList = course.students || course.enrolledStudents;
      if (studentsList && Array.isArray(studentsList) && studentsList.some(
        s => s === user._id || s?._id === user._id || s?.toString() === user._id
      )) {
        return true;
      }
      const cProgId = course.programId?._id ? String(course.programId._id) : (course.programId ? String(course.programId) : '');
      return Boolean(cProgId && userProgIds.includes(cProgId));
    });
  }, [courses, user]);

  const groupedPrograms = useMemo<GroupedProgram[]>(() => {
    const programMap = new Map<string, GroupedProgram>();

    // Pre-populate with student's enrolled program(s)
    enrolledPrograms.forEach(prog => {
      const progId = String(prog._id);
      programMap.set(progId, {
        id: progId,
        name: prog.name,
        code: prog.code,
        school: prog.school,
        faculty: prog.faculty,
        degreeLevel: prog.degreeLevel,
        majors: []
      });
    });

    if (visibleCourses && visibleCourses.length > 0) {
      visibleCourses.forEach(course => {
        const prog = course.programId;
        const progId = prog?._id ? String(prog._id) : (prog ? String(prog) : null);
        if (!progId || progId === 'general') return;

        const progName = prog?.name || 'Degree Program';
        const progCode = prog?.code;
        const progSchool = prog?.school;
        const progFaculty = prog?.faculty;
        const progDegreeLevel = prog?.degreeLevel;

        if (!programMap.has(progId)) {
          programMap.set(progId, {
            id: progId,
            name: progName,
            code: progCode,
            school: progSchool,
            faculty: progFaculty,
            degreeLevel: progDegreeLevel,
            majors: []
          });
        }

        const program = programMap.get(progId)!;

        const maj = course.majorId;
        const isCommon = course.isCommon || !maj;
        const majId = isCommon ? 'common' : (maj?._id ? String(maj._id) : (maj ? String(maj) : 'other'));
        const majName = isCommon ? 'Common Subjects' : (maj?.name || 'Specialized Major');
        const majCode = isCommon ? 'CORE' : maj?.code;
        const majDesc = maj?.description;

        let major = program.majors.find(m => m.id === majId);
        if (!major) {
          major = {
            id: majId,
            name: majName,
            code: majCode,
            description: majDesc,
            courses: []
          };
          program.majors.push(major);
        }

        major.courses.push(course);
      });
    }

    return Array.from(programMap.values());
  }, [visibleCourses, enrolledPrograms]);

  // Set initial selected program when programs load
  useEffect(() => {
    if (groupedPrograms.length > 0 && (!selectedProgramId || !groupedPrograms.find(p => p.id === selectedProgramId))) {
      setSelectedProgramId(groupedPrograms[0].id);
      setSelectedMajorFilter("all");
    }
  }, [groupedPrograms, selectedProgramId]);

  const activeProgram = useMemo(() => {
    return groupedPrograms.find(p => p.id === selectedProgramId) || groupedPrograms[0];
  }, [groupedPrograms, selectedProgramId]);

  const displayedCourses = useMemo(() => {
    if (!activeProgram) return [];
    if (selectedMajorFilter === "all") {
      return activeProgram.majors.flatMap(m =>
        m.courses.map(c => ({
          ...c,
          _majorName: m.name,
          _majorCode: m.code,
        }))
      );
    }
    const targetMajor = activeProgram.majors.find(m => m.id === selectedMajorFilter);
    return targetMajor
      ? targetMajor.courses.map(c => ({
          ...c,
          _majorName: targetMajor.name,
          _majorCode: targetMajor.code,
        }))
      : [];
  }, [activeProgram, selectedMajorFilter]);

  if (isLoading || isProgramsLoading) {
    return (
      <div className="min-h-screen bg-green-50/30 flex items-center justify-center p-6">
        <Loader size="lg" text="Loading program & majors..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50/30">
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Hero Header */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-900/5 p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-3">
                <GraduationCap className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-green-700 tracking-wide uppercase">
                  Academic Degree Program
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {isTeacherOrAdmin
                  ? "Program & Major Management"
                  : "Learning Management System"}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                {isTeacherOrAdmin
                  ? "Manage degree programs and their corresponding majors and subjects with full academic hierarchy."
                  : "Access your enrolled subjects, explore the full course catalog, and apply for additional courses with administrator approval."}
              </p>

              {/* Quick Overall Stats */}
              <div className="flex items-center gap-5 mt-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {visibleCourses.length} Enrolled Subject{visibleCourses.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {user?.role === "student" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">
                        {catalogCourses.length} Available in Catalog
                      </span>
                    </div>
                    {myRequests.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">
                          {myRequests.filter(r => r.status === "pending").length} Pending Application{myRequests.filter(r => r.status === "pending").length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">
                        {groupedPrograms.reduce((sum, p) => sum + p.majors.length, 0)} Major{groupedPrograms.reduce((sum, p) => sum + p.majors.length, 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">
                        {groupedPrograms.length} Program{groupedPrograms.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {isTeacherOrAdmin && (
                <Link href="/lms/courses/new">
                  <button className="inline-flex items-center gap-2 px-5 py-3 bg-green-700 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-800 transition-all">
                    <Plus className="w-4 h-4" />
                    Add Subject
                    <Sparkles className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </Link>
              )}
              {isTeacherOrAdmin && (
                <Link href="/lms/programs">
                  <button className="inline-flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-all">
                    <FolderTree className="w-4 h-4" />
                    Academic Tree
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Student Navigation Tabs */}
          {user?.role === "student" && (
            <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-100 flex-wrap">
              <button
                onClick={() => setStudentViewTab("enrolled")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  studentViewTab === "enrolled"
                    ? "bg-green-700 text-white shadow-md shadow-green-700/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                My Enrolled Courses
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  studentViewTab === "enrolled" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {visibleCourses.length}
                </span>
              </button>

              <button
                onClick={() => setStudentViewTab("explore")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  studentViewTab === "explore"
                    ? "bg-green-700 text-white shadow-md shadow-green-700/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Explore All Courses
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  studentViewTab === "explore" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {catalogCourses.length}
                </span>
              </button>

              <button
                onClick={() => setStudentViewTab("requests")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  studentViewTab === "requests"
                    ? "bg-green-700 text-white shadow-md shadow-green-700/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Clock className="w-4 h-4" />
                My Applications
                {myRequests.some(r => r.status === "pending") && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  studentViewTab === "requests" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {myRequests.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader size="lg" text="Loading program & majors..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-10 rounded-3xl text-center shadow">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchCourses()}
              className="px-5 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : user?.role === "student" && studentViewTab === "explore" ? (
          /* ── STUDENT TAB 2: EXPLORE ALL COURSES CATALOG ── */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-700" />
                  Course Catalog
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Browse all institution courses. Apply to enroll in as many courses as you need.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, code, instructor..."
                  value={exploreSearch}
                  onChange={(e) => setExploreSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                />
                {exploreSearch && (
                  <button
                    onClick={() => setExploreSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {isCatalogLoading ? (
              <div className="py-20 flex justify-center">
                <Loader size="md" text="Loading course catalog..." />
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="bg-white border border-slate-200/70 rounded-3xl p-16 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Courses Found</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  {exploreSearch ? "No courses matched your search query. Try different keywords." : "No courses are currently available in the catalog."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalog.map((course: any) => (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-green-300 shadow-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    {/* Header Banner */}
                    <div className="relative h-44 bg-gradient-to-br from-green-900/10 via-emerald-800/5 to-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      <PlayCircle className="w-14 h-14 text-green-600/80" />

                      {/* Top Badges Bar */}
                      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                        {course.programId?.name ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/95 text-green-800 px-2.5 py-1 rounded-lg shadow-xs border border-green-200 backdrop-blur-xs truncate max-w-[65%]">
                            <Layers className="w-3 h-3 text-green-700 shrink-0" />
                            <span className="truncate">{course.programId.name}</span>
                          </span>
                        ) : <div />}

                        {/* Status Chip */}
                        {course.isEnrolled ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                            Enrolled
                          </span>
                        ) : course.requestStatus === "pending" ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                            Application Pending
                          </span>
                        ) : course.requestStatus === "rejected" ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-xs">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-700 text-white shadow-xs">
                            Available
                          </span>
                        )}
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {course.courseCode && (
                            <span className="text-[10px] font-bold bg-white/95 text-slate-700 px-2 py-0.5 rounded shadow-xs border border-slate-200">
                              {course.courseCode}
                            </span>
                          )}
                          {course.totalSubjects !== undefined ? (
                            <span className="text-[10px] font-bold bg-green-50 text-green-800 px-2 py-0.5 rounded shadow-xs border border-green-200">
                              {course.totalSubjects} Modules / Subjects
                            </span>
                          ) : course.creditHours ? (
                            <span className="text-[10px] font-bold bg-green-50 text-green-800 px-2 py-0.5 rounded shadow-xs border border-green-200">
                              {course.creditHours} Cr Hrs
                            </span>
                          ) : null}
                          {course.category && (
                            <span className="text-[10px] font-medium bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur">
                              {course.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-snug mb-1.5 line-clamp-2">
                          {course.title || course.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {course.description || "Course study material, video lectures, assignments and mock exams."}
                        </p>
                        {course.school && (
                          <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 mb-1">
                            <span className="text-slate-400">School:</span>
                            <span className="font-bold text-slate-800">{course.school}</span>
                          </p>
                        )}
                        {course.instructor?.name && (
                          <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                            <span className="text-slate-400">Instructor:</span>
                            <span className="font-bold text-slate-800">{course.instructor.name}</span>
                          </p>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5 text-green-600" />
                          <span>{course.totalSubjects ? `${course.totalSubjects} Subjects` : `${course.enrolledCount || 0} Enrolled`}</span>
                        </div>

                        {course.isEnrolled ? (
                          course.type === "program" ? (
                            <button
                              onClick={() => {
                                setSelectedProgramId(course._id);
                                setSelectedMajorFilter("all");
                                setStudentViewTab("enrolled");
                              }}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all shadow-xs"
                            >
                              <span>Study Material</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <Link
                              href={`/lms/courses/${course._id}`}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all shadow-xs"
                            >
                              <span>Study Material</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )
                        ) : course.requestStatus === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-xl text-[11px]">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            Pending Approval
                          </span>
                        ) : course.requestStatus === "rejected" ? (
                          <button
                            onClick={() => setApplyingCourse(course)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-all"
                          >
                            <span>Re-apply</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setApplyingCourse(course)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Apply to Enroll</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : user?.role === "student" && studentViewTab === "requests" ? (
          /* ── STUDENT TAB 3: MY COURSE APPLICATIONS ── */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-700" />
                  My Course Applications
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Track the status of your enrollment applications submitted to the administration.
                </p>
              </div>

              <button
                onClick={() => setStudentViewTab("explore")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Apply for Another Course
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="bg-white border border-slate-200/70 rounded-3xl p-16 text-center shadow-sm">
                <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Applications Yet</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-5">
                  You have not submitted any enrollment applications. Explore the course catalog and apply for courses you wish to attend!
                </p>
                <button
                  onClick={() => setStudentViewTab("explore")}
                  className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Browse Course Catalog
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Applied Date</th>
                        <th className="px-6 py-4">Your Note</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {myRequests.map((req: any) => {
                        const courseTitle = req.programId?.name || req.courseId?.title || "Course";
                        const courseCode = req.programId?.code || req.courseId?.courseCode;
                        const categoryName = req.programId?.degreeLevel ? req.programId.degreeLevel.toUpperCase() : req.courseId?.category;
                        const isProgram = Boolean(req.programId);

                        return (
                          <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-sm">
                                {courseTitle}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                                {courseCode && (
                                  <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {courseCode}
                                  </span>
                                )}
                                {categoryName && <span>{categoryName}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-slate-600 line-clamp-2 italic">
                                {req.message ? `"${req.message}"` : <span className="text-slate-400 not-italic">No note provided</span>}
                              </p>
                              {req.status === "rejected" && req.rejectionReason && (
                                <p className="mt-1 text-[11px] text-rose-600 font-medium">
                                  Admin reason: {req.rejectionReason}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {req.status === "approved" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approved & Enrolled
                                </span>
                              ) : req.status === "rejected" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  <Clock className="w-3.5 h-3.5" />
                                  Pending Admin Approval
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {req.status === "approved" ? (
                                isProgram && req.programId?._id ? (
                                  <button
                                    onClick={() => {
                                      setSelectedProgramId(req.programId._id);
                                      setSelectedMajorFilter("all");
                                      setStudentViewTab("enrolled");
                                    }}
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all shadow-xs"
                                  >
                                    <span>Study Material</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : req.courseId?._id ? (
                                  <Link
                                    href={`/lms/courses/${req.courseId._id}`}
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-all shadow-xs"
                                  >
                                    <span>Study Material</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                ) : null
                              ) : req.status === "rejected" ? (
                                <button
                                  onClick={() => setApplyingCourse(req.programId || req.courseId)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                                >
                                  Re-apply
                                </button>
                              ) : (
                                <span className="text-slate-400 font-medium italic">Under Review</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : groupedPrograms.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {user?.role === "student" ? "No Courses Enrolled Yet" : "No Enrolled Program"}
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              {user?.role === "student"
                ? "You are not enrolled in any courses yet. You can explore all available courses in our catalog and apply with one click!"
                : "You are not currently enrolled in any academic programs."}
            </p>
            {user?.role === "student" && (
              <button
                onClick={() => setStudentViewTab("explore")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Explore Available Courses
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Multiple Programs Switcher (if user is enrolled in more than 1 program) */}
            {groupedPrograms.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Programs:</span>
                {groupedPrograms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProgramId(p.id);
                      setSelectedMajorFilter("all");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeProgram?.id === p.id
                        ? "bg-green-700 text-white shadow-md"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p.code ? `[${p.code}] ${p.name}` : p.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active Enrolled Program Card */}
            {activeProgram && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
                {/* Program Header Banner */}
                <div className="bg-gradient-to-r from-[#14532D] via-[#166534] to-[#14532D] text-white p-6 sm:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                        {activeProgram.code && (
                          <span className="text-[11px] font-bold bg-white/20 text-white border border-white/20 px-2.5 py-0.5 rounded-md backdrop-blur uppercase tracking-wider">
                            {activeProgram.code}
                          </span>
                        )}
                        {activeProgram.degreeLevel && (
                          <span className="text-[11px] font-bold bg-white/20 text-white border border-white/20 px-2.5 py-0.5 rounded-md backdrop-blur uppercase tracking-wider">
                            {activeProgram.degreeLevel}
                          </span>
                        )}
                        {activeProgram.school && (
                          <span className="text-xs text-slate-300">
                            {activeProgram.school}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {activeProgram.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="px-4 py-2.5 bg-white/10 rounded-2xl backdrop-blur border border-white/10 text-center min-w-[85px]">
                        <div className="text-[11px] text-slate-300 font-medium">Majors</div>
                        <div className="text-xl font-black text-white">{activeProgram.majors.length}</div>
                      </div>
                      <div className="px-4 py-2.5 bg-white/10 rounded-2xl backdrop-blur border border-white/10 text-center min-w-[85px]">
                        <div className="text-[11px] text-slate-300 font-medium">Subjects</div>
                        <div className="text-xl font-black text-white">
                          {activeProgram.majors.reduce((sum, m) => sum + m.courses.length, 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Major Navigation & Filter Pills inside this Program */}
                <div className="px-6 py-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">Enrolled Majors:</span>
                    <button
                      onClick={() => setSelectedMajorFilter("all")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedMajorFilter === "all"
                          ? "bg-green-700 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-green-700"
                      }`}
                    >
                      All ({activeProgram.majors.reduce((sum, m) => sum + m.courses.length, 0)})
                    </button>
                    {activeProgram.majors.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMajorFilter(m.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedMajorFilter === m.id
                            ? "bg-green-700 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-green-700"
                        }`}
                      >
                        <span>{m.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedMajorFilter === m.id ? 'bg-white/25 text-white' : 'bg-green-50 text-green-700 border border-green-200/60'}`}>
                          {m.courses.length}
                        </span>
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-400 font-medium hidden sm:inline shrink-0">
                    Showing {displayedCourses.length} course{displayedCourses.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Clean Direct Course Cards Grid under Program */}
                <div className="p-6 sm:p-8 bg-slate-50/40">
                  {displayedCourses.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center">
                      <BookOpen className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No courses or subjects published yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        You are enrolled in this program track. Your instructors will publish lectures, quizzes, and course modules here soon.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedCourses.map((course: any) => (
                        <Link
                          href={`/lms/courses/${course._id}`}
                          key={course._id}
                          className="group"
                        >
                          <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-green-300 shadow-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 overflow-hidden flex flex-col h-full">
                            {/* Subject Header Banner */}
                            <div className="relative h-44 bg-gradient-to-br from-green-900/10 via-emerald-800/5 to-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                              <PlayCircle className="w-14 h-14 text-green-600/80 group-hover:text-green-600 group-hover:scale-110 transition-all duration-300" />

                              {/* Top Badges Bar: Major Tag + Status Badge */}
                              <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                                {course._majorName ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/95 text-green-800 px-2.5 py-1 rounded-lg shadow-xs border border-green-200 backdrop-blur-xs min-w-0 max-w-[65%]">
                                    <Layers className="w-3 h-3 text-green-700 shrink-0" />
                                    <span className="truncate">{course._majorName}</span>
                                  </span>
                                ) : <div />}

                                <span
                                  className={`text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-xs border shrink-0 ${
                                    course.status === "active"
                                      ? "bg-green-700 text-white border-green-600"
                                      : "bg-slate-700 text-white border-slate-600"
                                  }`}
                                >
                                  {course.status === "active" ? "PUBLISHED" : course.status?.toUpperCase() || "DRAFT"}
                                </span>
                              </div>

                              {/* Course Code & Credit Hours on Bottom Left */}
                              <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {course.courseCode && (
                                    <span className="text-[10px] font-bold bg-white/95 text-slate-700 px-2 py-0.5 rounded shadow-xs border border-slate-200">
                                      {course.courseCode}
                                    </span>
                                  )}
                                  {course.creditHours && (
                                    <span className="text-[10px] font-bold bg-green-50 text-green-800 px-2 py-0.5 rounded shadow-xs border border-green-200">
                                      {course.creditHours} Cr Hrs
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-slate-900 text-base leading-snug mb-1.5 group-hover:text-green-700 transition-colors line-clamp-2">
                                  {course.title}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                  {course.description || "Comprehensive subject materials, lectures, and assignments."}
                                </p>
                              </div>

                              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Users className="w-3.5 h-3.5 text-green-600" />
                                  <span>{course.enrolledStudents?.length || 0} Enrolled</span>
                                </div>

                                <div className="flex items-center gap-1 text-green-700 font-bold group-hover:translate-x-0.5 transition-transform">
                                  <span>{isTeacherOrAdmin ? "Manage" : "Study Material"}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── APPLY TO ENROLL MODAL ── */}
        {applyingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-green-900 to-green-800 text-white flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Send className="w-3 h-3" /> Course Enrollment Application
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {applyingCourse.title}
                  </h3>
                  {applyingCourse.courseCode && (
                    <p className="text-xs text-green-200 mt-1 font-semibold">
                      Course Code: {applyingCourse.courseCode}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setApplyingCourse(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all ml-4 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleApplyCourse} className="p-6 space-y-4">
                <div className="p-4 bg-green-50/70 border border-green-100 rounded-2xl text-xs text-green-900 leading-relaxed">
                  <p className="font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-green-700" />
                    How Enrollment Works:
                  </p>
                  <p className="text-slate-600">
                    Your application will be sent directly to your institution administrator for approval. As soon as approved, you will have instant full access to study materials, lectures, and assignments.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Message to Admin / Reason for Enrollment (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="e.g. I need this course to fulfill my academic requirements or for elective study..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyingCourse(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}