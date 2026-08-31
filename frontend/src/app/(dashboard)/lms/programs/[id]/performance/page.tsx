"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  GraduationCap, BarChart3, TrendingUp, Users, BookOpen,
  ArrowLeft, ChevronDown, ChevronRight, Award, AlertCircle,
  CheckCircle, XCircle, Layers, Calculator, Star
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import * as lmsService from "@/services/lms.service";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CoursePerf {
  _id: string;
  title: string;
  courseCode?: string;
  creditHours: number;
  isCommon: boolean;
  majorId?: string;
  score: number;
  quizAvg: number | null;
  assignAvg: number | null;
  attendPct: number | null;
  dataAvailable: boolean;
}

interface MajorBreakdown {
  majorId: string;
  majorName: string;
  majorCode?: string;
  performance: number;
  courses: CoursePerf[];
}

interface StudentRow {
  studentId: string;
  name: string;
  email: string;
  rollNumber?: string;
  degreePerformance: number;
  majorPerformance: number | null;
  commonSubjectsPerformance: number | null;
  isPassing: boolean;
}

interface OverviewData {
  program: { _id: string; name: string; school?: string };
  majors: any[];
  totalStudents: number;
  classAvgPerformance: number;
  students: StudentRow[];
  courses: any[];
}

interface StudentPerfData {
  student: { _id: string; name: string; email: string; rollNumber?: string };
  program: { _id: string; name: string; school?: string; passingGradePercent?: number };
  degreePerformance: number;
  majorPerformance: number | null;
  commonSubjectsPerformance: number | null;
  majorBreakdown: MajorBreakdown[];
  commonCourses: CoursePerf[];
  courses: CoursePerf[];
  isPassing: boolean;
  message?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200";
  if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
};

const ScoreBadge = ({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) => (
  <span className={`inline-flex items-center font-bold rounded-full border px-2.5 ${size === "lg" ? "py-1 text-base" : "py-0.5 text-xs"} ${scoreColor(score)}`}>
    {score.toFixed(1)}%
  </span>
);

const MiniBar = ({ value, max = 100, color = "indigo" }: { value: number; max?: number; color?: string }) => (
  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
    <div className={`h-full bg-${color}-500 rounded-full transition-all`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ProgramPerformancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useStore();
  const programId = params?.id as string;

  const isStudent = user?.role === "student";

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [studentData, setStudentData] = useState<StudentPerfData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [drillData, setDrillData] = useState<StudentPerfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drillLoading, setDrillLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedMajors, setExpandedMajors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!programId || !user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        if (isStudent) {
          const data = await lmsService.getStudentDegreePerformance(programId);
          setStudentData(data);
        } else {
          const data = await lmsService.getProgramPerformanceOverview(programId);
          setOverviewData(data);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load performance data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [programId, user]);

  const handleDrillStudent = async (student: StudentRow) => {
    setSelectedStudent(student);
    setDrillLoading(true);
    try {
      const data = await lmsService.getStudentDegreePerformance(programId, student.studentId);
      setDrillData(data);
      setExpandedMajors(new Set((data.majorBreakdown || []).map((m: MajorBreakdown) => m.majorId)));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Failed to load student performance.");
    } finally {
      setDrillLoading(false);
    }
  };

  const toggleMajor = (id: string) => setExpandedMajors(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Which data to show for the performance detail panel
  const displayData: StudentPerfData | null = isStudent ? studentData : drillData;

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/lms/programs"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {isStudent ? "My Degree Performance" : "Program Performance Overview"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStudent
              ? "Your academic performance breakdown across all courses"
              : "Multi-level weighted performance across all enrolled students"
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader size="md" text="Computing weighted performance..." /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ═══ LEFT: OVERVIEW / STUDENT LIST ═══ */}
          <div className="xl:col-span-1 space-y-5">
            {/* KPI Cards */}
            {isStudent && studentData ? (
              <StudentKPICards data={studentData} />
            ) : overviewData ? (
              <AdminKPICards data={overviewData} />
            ) : null}

            {/* Student list (admin/teacher only) */}
            {!isStudent && overviewData && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Students
                  </h3>
                  <span className="text-xs text-slate-400">{overviewData.students.length} enrolled</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                  {overviewData.students.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No students enrolled.</p>
                  ) : (
                    overviewData.students.map(s => (
                      <button key={s.studentId}
                        onClick={() => handleDrillStudent(s)}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors ${selectedStudent?.studentId === s.studentId ? "bg-indigo-50 border-l-2 border-indigo-500" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {s.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                          {s.rollNumber && <p className="text-xs text-slate-400 font-mono">{s.rollNumber}</p>}
                          <MiniBar value={s.degreePerformance} color={s.degreePerformance >= 60 ? "emerald" : "red"} />
                        </div>
                        <div className="shrink-0">
                          <ScoreBadge score={s.degreePerformance} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT: PERFORMANCE DETAIL PANEL ═══ */}
          <div className="xl:col-span-2 space-y-5">
            {drillLoading && (
              <div className="flex justify-center py-10"><Loader size="md" text="Loading student details..." /></div>
            )}
            {!drillLoading && displayData && (
              <PerformanceDetailPanel
                data={displayData}
                expandedMajors={expandedMajors}
                toggleMajor={toggleMajor}
                isStudent={isStudent}
              />
            )}
            {!drillLoading && !displayData && !isStudent && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                <Users className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Select a student</p>
                <p className="text-slate-400 text-sm mt-1">Click a student to view their detailed degree performance</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Student KPI Cards ─────────────────────────────────────────────────────────
function StudentKPICards({ data }: { data: StudentPerfData }) {
  return (
    <div className="space-y-3">
      {/* Degree Performance */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 opacity-80" />
          <span className="text-sm font-semibold opacity-80">{data.program.name}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-black">{data.degreePerformance.toFixed(1)}%</p>
            <p className="text-sm opacity-70 mt-1">Overall Degree Performance</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${data.isPassing ? "bg-emerald-500/30 text-emerald-100" : "bg-red-500/30 text-red-100"}`}>
            {data.isPassing ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {data.isPassing ? "Passing" : "Failing"}
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, data.degreePerformance)}%` }} />
        </div>
        {data.program.passingGradePercent && (
          <p className="text-xs opacity-60 mt-1">Passing threshold: {data.program.passingGradePercent}%</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.majorPerformance !== null && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Major</span>
            </div>
            <p className="text-2xl font-black text-purple-800">{data.majorPerformance.toFixed(1)}%</p>
          </div>
        )}
        {data.commonSubjectsPerformance !== null && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Common</span>
            </div>
            <p className="text-2xl font-black text-emerald-800">{data.commonSubjectsPerformance.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Weighted Formula Explainer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Weighted Calculation</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Each course score = 40% Quizzes + 40% Assignments + 20% Attendance<br />
          Degree Performance = Σ(Course Score × Credit Hours) ÷ Σ(Credit Hours)
        </p>
      </div>
    </div>
  );
}

// ── Admin KPI Cards ───────────────────────────────────────────────────────────
function AdminKPICards({ data }: { data: OverviewData }) {
  const passing = data.students.filter(s => s.isPassing).length;
  const failing = data.students.filter(s => !s.isPassing).length;

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm font-semibold opacity-60 mb-1">{data.program.name}</p>
        {data.program.school && <p className="text-xs opacity-40 mb-3">{data.program.school}</p>}
        <p className="text-4xl font-black">{data.classAvgPerformance.toFixed(1)}%</p>
        <p className="text-sm opacity-60 mt-1">Class Average Performance</p>
        <div className="mt-4 bg-white/10 rounded-full h-2">
          <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, data.classAvgPerformance)}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Students", value: data.totalStudents, icon: <Users className="w-4 h-4" />, color: "blue" },
          { label: "Passing", value: passing, icon: <CheckCircle className="w-4 h-4" />, color: "emerald" },
          { label: "Failing", value: failing, icon: <XCircle className="w-4 h-4" />, color: "red" },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-3 text-center`}>
            <div className={`flex justify-center text-${s.color}-600 mb-1`}>{s.icon}</div>
            <p className={`text-xl font-black text-${s.color}-800`}>{s.value}</p>
            <p className={`text-[10px] font-bold text-${s.color}-600 uppercase`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Performance Detail Panel ──────────────────────────────────────────────────
function PerformanceDetailPanel({
  data,
  expandedMajors,
  toggleMajor,
  isStudent,
}: {
  data: StudentPerfData;
  expandedMajors: Set<string>;
  toggleMajor: (id: string) => void;
  isStudent: boolean;
}) {
  return (
    <>
      {/* Student header (admin view) */}
      {!isStudent && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-black text-xl shrink-0">
            {data.student.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg">{data.student.name}</h3>
            <p className="text-sm text-slate-500">{data.student.email}</p>
            {data.student.rollNumber && <p className="text-xs font-mono text-slate-400">{data.student.rollNumber}</p>}
          </div>
          <div className="text-right">
            <ScoreBadge score={data.degreePerformance} size="lg" />
            <p className="text-xs text-slate-400 mt-1">Degree Performance</p>
            <span className={`text-xs font-bold ${data.isPassing ? "text-emerald-600" : "text-red-600"}`}>
              {data.isPassing ? "✓ Passing" : "✗ Failing"}
            </span>
          </div>
        </div>
      )}

      {/* Message if no data */}
      {data.message && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">{data.message}</div>
      )}

      {/* Common Subjects */}
      {data.commonCourses && data.commonCourses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Common Subjects</h3>
            {data.commonSubjectsPerformance !== null && (
              <ScoreBadge score={data.commonSubjectsPerformance} />
            )}
          </div>
          <CourseTable courses={data.commonCourses} />
        </div>
      )}

      {/* Majors */}
      {data.majorBreakdown && data.majorBreakdown.length > 0 && data.majorBreakdown.map(major => (
        <div key={String(major.majorId)} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => toggleMajor(String(major.majorId))}
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{major.majorName}</span>
                {major.majorCode && (
                  <span className="text-xs font-mono font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">{major.majorCode}</span>
                )}
              </div>
              <p className="text-xs text-slate-400">{major.courses.length} subjects</p>
            </div>
            <ScoreBadge score={major.performance} />
            {expandedMajors.has(String(major.majorId))
              ? <ChevronDown className="w-4 h-4 text-slate-400" />
              : <ChevronRight className="w-4 h-4 text-slate-400" />
            }
          </button>
          {expandedMajors.has(String(major.majorId)) && (
            <CourseTable courses={major.courses} />
          )}
        </div>
      ))}

      {/* All courses fallback if no breakdown */}
      {(!data.majorBreakdown || data.majorBreakdown.length === 0) && data.courses && data.courses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />All Courses
            </h3>
          </div>
          <CourseTable courses={data.courses} />
        </div>
      )}
    </>
  );
}

// ── Course Table ──────────────────────────────────────────────────────────────
function CourseTable({ courses }: { courses: CoursePerf[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {["Subject", "Code", "Credits", "Quizzes", "Assignments", "Attendance", "Score"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {courses.map(c => (
            <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-800 text-sm">{c.title}</div>
                {!c.dataAvailable && (
                  <span className="text-[10px] text-amber-600 font-medium">No assessment data</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.courseCode || "—"}</td>
              <td className="px-4 py-3 text-center">
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{c.creditHours} Cr</span>
              </td>
              <td className="px-4 py-3">
                {c.quizAvg !== null ? (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold">{c.quizAvg.toFixed(1)}%</span>
                    <MiniBar value={c.quizAvg} color="indigo" />
                  </div>
                ) : <span className="text-slate-300 text-xs">—</span>}
              </td>
              <td className="px-4 py-3">
                {c.assignAvg !== null ? (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold">{c.assignAvg.toFixed(1)}%</span>
                    <MiniBar value={c.assignAvg} color="purple" />
                  </div>
                ) : <span className="text-slate-300 text-xs">—</span>}
              </td>
              <td className="px-4 py-3">
                {c.attendPct !== null ? (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold">{c.attendPct.toFixed(1)}%</span>
                    <MiniBar value={c.attendPct} color="teal" />
                  </div>
                ) : <span className="text-slate-300 text-xs">—</span>}
              </td>
              <td className="px-4 py-3">
                <ScoreBadge score={c.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
