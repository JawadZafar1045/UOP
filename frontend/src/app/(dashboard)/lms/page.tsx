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
        if (!progId || progId === 'general') return; // Remove general fallback

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

  if (user?.role === 'student' && groupedPrograms.length === 0 && enrolledPrograms.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-green-50/30 flex items-center justify-center p-6">
        <div className="text-center py-16 px-8 bg-white border border-slate-200/60 rounded-3xl shadow-sm max-w-lg w-full">
          <div className="text-5xl mb-4">🎓</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Enrolled Program Yet
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            You are not enrolled in any academic programs or majors yet.
            Please contact your teacher or administrator to get enrolled.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-all">
            Return to Dashboard
          </Link>
        </div>
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
                  : "My Enrolled Program"}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                {isTeacherOrAdmin
                  ? "Manage degree programs and their corresponding majors and subjects with full academic hierarchy."
                  : "View your degree program with all your enrolled majors and course subjects organized neatly."}
              </p>

              {/* Quick Overall Stats */}
              <div className="flex items-center gap-5 mt-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {groupedPrograms.length} Program{groupedPrograms.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {groupedPrograms.reduce((sum, p) => sum + p.majors.length, 0)} Major{groupedPrograms.reduce((sum, p) => sum + p.majors.length, 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {visibleCourses.length} Subject{visibleCourses.length !== 1 ? "s" : ""}
                  </span>
                </div>
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
              <Link href="/lms/programs">
                <button className="inline-flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-all">
                  <FolderTree className="w-4 h-4" />
                  Academic Tree
                </button>
              </Link>
            </div>
          </div>
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
        ) : groupedPrograms.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">No Enrolled Program</h3>
            <p className="text-slate-500 text-sm">You are not currently enrolled in any academic programs.</p>
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
                                  <span>{isTeacherOrAdmin ? "Manage" : "Continue"}</span>
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
      </div>
    </div>
  );
}