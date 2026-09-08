"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  GraduationCap, BookOpen, Users, Plus, Pencil, Trash2,
  ChevronRight, ChevronDown, School, Layers, FolderOpen,
  X, Check, AlertCircle, Search, BarChart3, Sparkles, Upload, Image as ImageIcon
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import * as lmsService from "@/services/lms.service";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Program {
  _id: string;
  name: string;
  code?: string;
  school?: string;
  faculty?: string;
  description?: string;
  degreeLevel?: string;
  totalCreditHours?: number;
  passingGradePercent?: number;
  thumbnail?: string;
  status: string;
}

interface Major {
  _id: string;
  programId: any;
  name: string;
  code?: string;
  description?: string;
  status: string;
}

interface AcademicNode {
  _id: string;
  name: string;
  code?: string;
  school?: string;
  degreeLevel?: string;
  thumbnail?: string;
  status: string;
  commonSubjects: any[];
  majors: Array<{ _id: string; name: string; code?: string; subjects: any[] }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const levelColors: Record<string, string> = {
  undergraduate: "bg-green-50 text-green-800 border-green-200",
  postgraduate:  "bg-emerald-50 text-emerald-800 border-emerald-200",
  diploma:       "bg-amber-50 text-amber-800 border-amber-200",
  certificate:   "bg-teal-50 text-teal-800 border-teal-200",
  other:         "bg-slate-100 text-slate-600 border-slate-200",
};

const emptyProg = (): Partial<Program> => ({
  name: "", code: "", school: "", faculty: "", description: "",
  degreeLevel: "undergraduate", totalCreditHours: 120, passingGradePercent: 60,
});
const emptyMajor = (programId = ""): Partial<Major & { programId: string }> => ({
  name: "", code: "", description: "", programId,
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AcademicProgramsPage() {
  const router = useRouter();
  const { user } = useStore();

  const [tree, setTree] = useState<AcademicNode[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Expanded nodes in tree
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // Modals
  const [progModal, setProgModal] = useState<{ open: boolean; editing: Partial<Program> | null }>({ open: false, editing: null });
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; program: AcademicNode | null }>({ open: false, program: null });
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [isUploadingProgThumb, setIsUploadingProgThumb] = useState(false);
  const [majorModal, setMajorModal] = useState<{ open: boolean; editing: Partial<Major & { programId: string }> | null; defaultProgramId: string }>({ open: false, editing: null, defaultProgramId: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "program" | "major"; id: string; label: string } | null>(null);

  const isAdmin = user?.role === "admin";

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, p, m, stds, adminUsers] = await Promise.all([
        lmsService.getAcademicTree(),
        lmsService.getPrograms(),
        lmsService.getMajors(),
        lmsService.getTenantStudents().catch(() => []),
        lmsService.getAdminUsers().catch(() => []),
      ]);
      setTree(t || []);
      setPrograms(p || []);
      setMajors(m || []);

      let allStds: any[] = [];
      if (Array.isArray(adminUsers) && adminUsers.length > 0) {
        allStds = adminUsers.filter((u: any) => u.role === 'student');
      }
      if (allStds.length === 0 && Array.isArray(stds) && stds.length > 0) {
        allStds = stds;
      }
      setStudents(allStds);

      // Auto-expand all programs if few
      if ((t || []).length <= 5) {
        setExpandedPrograms(new Set((t || []).map((n: AcademicNode) => n._id)));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load academic structure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleExpand = (id: string) => {
    setExpandedPrograms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Program Modal Submit ──────────────────────────────────────────────────
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = progModal.editing!;
      if (data._id) {
        await lmsService.updateProgram(data._id, data);
      } else {
        await lmsService.createProgram(data);
      }
      setProgModal({ open: false, editing: null });
      await fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to save program.");
    } finally {
      setSaving(false);
    }
  };

  // ── Major Modal Submit ────────────────────────────────────────────────────
  const handleSaveMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = majorModal.editing!;
      let savedMajor: any;
      if ((data as any)._id) {
        savedMajor = await lmsService.updateMajor((data as any)._id, data);
      } else {
        savedMajor = await lmsService.createMajor(data);
      }
      setMajorModal({ open: false, editing: null, defaultProgramId: "" });
      await fetchAll();

      // Redirect directly to course edit/create page for this major
      if (savedMajor) {
        const progId = typeof savedMajor.programId === 'object' ? savedMajor.programId?._id : savedMajor.programId;
        router.push(`/lms/courses/new?programId=${progId || data.programId}&majorId=${savedMajor._id || ''}&title=${encodeURIComponent(savedMajor.name || '')}`);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to save major.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Confirm ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      if (confirmDelete.type === "program") await lmsService.deleteProgram(confirmDelete.id);
      else await lmsService.deleteMajor(confirmDelete.id);
      setConfirmDelete(null);
      await fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };


  const filteredTree = tree.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.school?.toLowerCase().includes(search.toLowerCase()) ||
    n.majors.some(m => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMajors = tree.reduce((s, n) => s + n.majors.length, 0);
  const totalSubjects = tree.reduce((s, n) => s + n.commonSubjects.length + n.majors.reduce((ms, m) => ms + m.subjects.length, 0), 0);

  if (!user) return null;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto py-2 sm:py-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <Link
              href="/lms"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 transition-colors"
            >
              ← Back to Learning Hub
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg shadow-green-700/20 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            Academic Structure
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            {isAdmin
              ? "Manage degree programs, majors, and subject hierarchy"
              : "Explore degree programs, majors, and academic hierarchy"}
          </p>
        </div>
        {isAdmin && (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setMajorModal({ open: true, editing: emptyMajor(programs[0]?._id || ""), defaultProgramId: programs[0]?._id || "" })}
              disabled={programs.length === 0}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-green-800 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Major</span>
            </button>
            <button onClick={() => setProgModal({ open: true, editing: emptyProg() })}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-green-700 hover:bg-green-800 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-green-700/25 hover:shadow-lg">
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Program</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Programs", value: programs.length, icon: <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-green-50", text: "text-green-700" },
          { label: "Majors", value: totalMajors, icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-emerald-50", text: "text-emerald-700" },
          { label: "Subjects", value: totalSubjects, icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-teal-50", text: "text-teal-700" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${s.bg} rounded-lg sm:rounded-xl flex items-center justify-center ${s.text} shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{loading ? "..." : s.value}</p>
                <p className={`text-[9px] sm:text-[10px] font-bold ${s.text} uppercase tracking-normal sm:tracking-widest truncate`}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          placeholder="Search programs, majors..." />
      </div>

      {/* ── Academic Tree ── */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader size="md" text="Loading academic structure..." /></div>
      ) : filteredTree.length === 0 ? (
        <div className="text-center py-16 sm:py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white px-4">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold">{isAdmin ? "No programs found." : "No Enrolled Academic Programs"}</p>
          <p className="text-slate-400 text-xs mt-1">
            {isAdmin
              ? "Create a new degree program to start structuring majors and courses."
              : "You are not currently enrolled in any academic programs or majors. Please contact your teacher or administrator."}
          </p>
          {isAdmin && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={() => setProgModal({ open: true, editing: emptyProg() })}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-700 hover:bg-green-800 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-green-700/20">
                <Plus className="w-4 h-4" />
                Add Program
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTree.map(program => {
            const isExpanded = expandedPrograms.has(program._id);
            return (
              <div key={program._id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden hover:shadow-md transition-all">
                {/* Program Header */}
                <div className="p-3.5 sm:p-5">
                  <div
                    className="flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer group select-none"
                    onClick={() => toggleExpand(program._id)}
                  >
                    {program.thumbnail ? (
                      <div className="w-12 h-10 sm:w-16 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                        <img src={program.thumbnail} alt={program.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border border-green-100">
                        <School className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-green-800 transition-colors">
                          {program.name}
                        </h2>
                        {program.code && (
                          <span className="text-[10px] sm:text-xs font-bold font-mono bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200">
                            {program.code}
                          </span>
                        )}
                        {program.degreeLevel && (
                          <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${levelColors[program.degreeLevel] || levelColors.other}`}>
                            {program.degreeLevel}
                          </span>
                        )}
                        {program.status === "archived" && (
                          <span className="text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                            Archived
                          </span>
                        )}
                      </div>
                      {program.school && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{program.school}</p>
                      )}
                      <div className="flex items-center gap-2.5 sm:gap-4 mt-1">
                        <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                          {program.majors.length} major{program.majors.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                          {program.commonSubjects.length} common subject{program.commonSubjects.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Action Group (lg and above) */}
                    <div className="hidden lg:flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <>
                          <Link href={`/lms/programs/${program._id}/performance`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
                            <BarChart3 className="w-3.5 h-3.5" />Performance
                          </Link>
                          <button onClick={async e => {
                            e.stopPropagation();
                            setEnrollModal({ open: true, program });
                            setSelectedStudentId("");
                            try {
                              const adminUsers = await lmsService.getAdminUsers().catch(() => []);
                              if (Array.isArray(adminUsers) && adminUsers.length > 0) {
                                setStudents(adminUsers.filter((u: any) => u.role === 'student'));
                              } else {
                                const stds = await lmsService.getTenantStudents().catch(() => []);
                                setStudents(stds || []);
                              }
                            } catch {}
                          }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                            <Users className="w-3.5 h-3.5" />Enroll Student
                          </button>
                          <button onClick={e => { e.stopPropagation(); setMajorModal({ open: true, editing: emptyMajor(program._id), defaultProgramId: program._id }); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                            <Plus className="w-3.5 h-3.5" />Major
                          </button>
                          <button onClick={e => { e.stopPropagation(); setProgModal({ open: true, editing: { ...program } }); }}
                            className="p-1.5 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Program">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmDelete({ type: "program", id: program._id, label: program.name }); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Program">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <div className="p-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                        {isExpanded
                          ? <ChevronDown className="w-5 h-5 text-green-700" />
                          : <ChevronRight className="w-5 h-5" />
                        }
                      </div>
                    </div>

                    {/* Mobile Chevron toggle */}
                    <div className="lg:hidden shrink-0 text-slate-400 p-1">
                      {isExpanded
                        ? <ChevronDown className="w-5 h-5 text-green-700" />
                        : <ChevronRight className="w-5 h-5" />
                      }
                    </div>
                  </div>

                  {/* Mobile Action Bar (below header on screens < lg) */}
                  {isAdmin && (
                    <div className="lg:hidden mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/lms/programs/${program._id}/performance`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Performance</span>
                        </Link>
                        <button onClick={async e => {
                          e.stopPropagation();
                          setEnrollModal({ open: true, program });
                          setSelectedStudentId("");
                          try {
                            const adminUsers = await lmsService.getAdminUsers().catch(() => []);
                            if (Array.isArray(adminUsers) && adminUsers.length > 0) {
                              setStudents(adminUsers.filter((u: any) => u.role === 'student'));
                            } else {
                              const stds = await lmsService.getTenantStudents().catch(() => []);
                              setStudents(stds || []);
                            }
                          } catch {}
                        }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                          <Users className="w-3.5 h-3.5" />
                          <span>Enroll</span>
                        </button>
                        <button onClick={e => { e.stopPropagation(); setMajorModal({ open: true, editing: emptyMajor(program._id), defaultProgramId: program._id }); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Major</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); setProgModal({ open: true, editing: { ...program } }); }}
                          className="p-1.5 text-slate-500 hover:text-green-700 bg-slate-50 hover:bg-green-50 border border-slate-200 rounded-lg transition-colors"
                          title="Edit Program">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDelete({ type: "program", id: program._id, label: program.name }); }}
                          className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors"
                          title="Delete Program">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-5 space-y-4">
                    {/* Common Subjects */}
                    {program.commonSubjects.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Common Subjects</span>
                          <span className="text-xs text-slate-400">({program.commonSubjects.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-0 sm:pl-7">
                          {program.commonSubjects.map((s: any) => (
                            <div key={s._id} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg pl-2.5 pr-1.5 py-1 text-xs font-medium text-slate-700 hover:border-green-300 transition-all max-w-full">
                              <Link href={`/lms/courses/${s._id}`} className="flex items-center gap-1.5 hover:text-green-700 min-w-0">
                                <BookOpen className="w-3 h-3 text-green-600 shrink-0" />
                                <span className="truncate">{s.title}</span>
                                {s.courseCode && <span className="font-mono text-slate-400 shrink-0">{s.courseCode}</span>}
                                {s.creditHours && <span className="text-slate-400 shrink-0">{s.creditHours} Cr</span>}
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm(`Delete course "${s.title}"?`)) {
                                      try {
                                        await lmsService.deleteCourse(s._id);
                                        await fetchAll();
                                      } catch (err: any) {
                                        alert(err?.response?.data?.message || err?.message || "Failed to delete course");
                                      }
                                    }
                                  }}
                                  className="p-1 text-slate-300 hover:text-red-600 rounded transition-colors shrink-0"
                                  title="Delete Course"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Majors */}
                    {program.majors.length > 0 ? (
                      <div className="space-y-3">
                        {program.majors.map(major => (
                          <div key={major._id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                                  <FolderOpen className="w-3.5 h-3.5 text-green-700" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm break-words">{major.name}</span>
                                {major.code && (
                                  <span className="text-xs font-mono font-bold bg-green-50 text-green-800 px-1.5 py-0.5 rounded border border-green-100">
                                    {major.code}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400">({major.subjects.length} subjects)</span>
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
                                  <Link
                                    href={`/lms/courses/new?programId=${program._id}&majorId=${major._id}&title=${encodeURIComponent(major.name)}`}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Add/Edit Content
                                  </Link>
                                  <button onClick={() => setMajorModal({ open: true, editing: { ...(major as any) }, defaultProgramId: program._id })}
                                    className="p-1 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Rename Major"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setConfirmDelete({ type: "major", id: major._id, label: major.name })}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Major"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {major.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-0 sm:pl-9">
                                {major.subjects.map((s: any) => (
                                  <div key={s._id} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-1.5 py-1 text-xs font-medium text-slate-700 hover:border-green-300 transition-all max-w-full">
                                    <Link href={`/lms/courses/${s._id}`} className="flex items-center gap-1.5 hover:text-green-700 min-w-0">
                                      <BookOpen className="w-3 h-3 text-green-600 shrink-0" />
                                      <span className="truncate">{s.title}</span>
                                      {s.courseCode && <span className="font-mono text-slate-400 shrink-0">{s.courseCode}</span>}
                                      {s.creditHours && <span className="text-slate-400 shrink-0">{s.creditHours} Cr</span>}
                                    </Link>
                                    {isAdmin && (
                                      <button
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (confirm(`Delete course "${s.title}"?`)) {
                                            try {
                                              await lmsService.deleteCourse(s._id);
                                              await fetchAll();
                                            } catch (err: any) {
                                              alert(err?.response?.data?.message || err?.message || "Failed to delete course");
                                            }
                                          }
                                        }}
                                        className="p-1 text-slate-300 hover:text-red-600 rounded transition-colors shrink-0"
                                        title="Delete Course"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 pl-0 sm:pl-9">No subjects assigned yet.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No majors defined yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ PROGRAM MODAL ═══════════════ */}
      {progModal.open && progModal.editing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-700 shrink-0" />
                <span>{progModal.editing._id ? "Edit Program" : "New Academic Program"}</span>
              </h3>
              <button onClick={() => setProgModal({ open: false, editing: null })} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProgram} className="overflow-y-auto flex-1">
              <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Program Name *</label>
                    <input required value={progModal.editing.name || ""} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, name: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="e.g. BSc Agriculture" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Code</label>
                    <input value={progModal.editing.code || ""} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, code: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-mono uppercase"
                      placeholder="BSC-AGRI" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Degree Level</label>
                    <select value={progModal.editing.degreeLevel || "undergraduate"} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, degreeLevel: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                      {["undergraduate", "postgraduate", "diploma", "certificate", "other"].map(l => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">School / Faculty</label>
                    <input value={progModal.editing.school || ""} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, school: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="e.g. School of Agriculture" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Total Credit Hours</label>
                    <input type="number" min={0} value={progModal.editing.totalCreditHours ?? 120} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, totalCreditHours: +e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Passing Grade (%)</label>
                    <input type="number" min={0} max={100} value={progModal.editing.passingGradePercent ?? 60} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, passingGradePercent: +e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
                    <textarea rows={2} value={progModal.editing.description || ""} onChange={e => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, description: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                      placeholder="Brief description..." />
                  </div>

                  {/* Thumbnail & Homepage display for Program */}
                  <div className="col-span-1 sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Program Thumbnail (Cloudinary)</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {progModal.editing.thumbnail ? (
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-xs shrink-0 bg-white">
                            <img src={progModal.editing.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProgModal(prev => ({ ...prev, editing: { ...prev.editing!, thumbnail: "" } }))}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-xs"
                              title="Remove thumbnail"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white text-slate-400 text-[10px] shrink-0">
                            <ImageIcon className="w-5 h-5 mb-0.5" />
                            <span>No Image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <label className={`inline-flex items-center gap-2 px-3.5 py-2 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-xs ${isUploadingProgThumb ? 'bg-green-600/70 cursor-wait' : 'bg-green-700 hover:bg-green-800'}`}>
                            {isUploadingProgThumb ? <Loader size="sm" /> : <Upload className="w-3.5 h-3.5" />}
                            <span>{isUploadingProgThumb ? "Uploading..." : progModal.editing.thumbnail ? "Change Image" : "Upload Thumbnail"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingProgThumb}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploadingProgThumb(true);
                                try {
                                  const url = await lmsService.uploadThumbnail(file);
                                  if (url) {
                                    setProgModal(prev => ({
                                      ...prev,
                                      editing: {
                                        ...prev.editing,
                                        thumbnail: url
                                      }
                                    }));
                                  } else {
                                    alert("Upload finished but no image URL was returned.");
                                  }
                                } catch (err: any) {
                                  alert(err?.response?.data?.message || err?.message || "Failed to upload thumbnail to Cloudinary");
                                } finally {
                                  setIsUploadingProgThumb(false);
                                }
                              }}
                            />
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {progModal.editing.thumbnail ? "✓ Uploaded & ready. Click 'Save Changes' to apply." : "Select JPG or PNG to upload to Cloudinary."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setProgModal({ open: false, editing: null })}
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-green-700 hover:bg-green-800 active:scale-[0.98] rounded-xl transition-all disabled:opacity-50 shadow-md shadow-green-700/20">
                  {saving ? <Loader size="sm" /> : <Check className="w-4 h-4" />}
                  <span>{progModal.editing._id ? "Save Changes" : "Create Program"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MAJOR MODAL ═══════════════ */}
      {majorModal.open && majorModal.editing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-green-700 shrink-0" />
                <span>{(majorModal.editing as any)._id ? "Edit Major" : "New Major / Specialization"}</span>
              </h3>
              <button onClick={() => setMajorModal({ open: false, editing: null, defaultProgramId: "" })} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMajor}>
              <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Program (Degree) *</label>
                  <select required value={majorModal.editing.programId || ""} onChange={e => setMajorModal(prev => ({ ...prev, editing: { ...prev.editing!, programId: e.target.value } }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option value="">Select program...</option>
                    {programs.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Major Name *</label>
                    <input required value={majorModal.editing.name || ""} onChange={e => setMajorModal(prev => ({ ...prev, editing: { ...prev.editing!, name: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="e.g. Agronomy" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Code</label>
                    <input value={majorModal.editing.code || ""} onChange={e => setMajorModal(prev => ({ ...prev, editing: { ...prev.editing!, code: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-mono uppercase"
                      placeholder="AGRON" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                    <select value={majorModal.editing.status || "active"} onChange={e => setMajorModal(prev => ({ ...prev, editing: { ...prev.editing!, status: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
                    <textarea rows={2} value={majorModal.editing.description || ""} onChange={e => setMajorModal(prev => ({ ...prev, editing: { ...prev.editing!, description: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                      placeholder="Brief description..." />
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100">
                <button type="button" onClick={() => setMajorModal({ open: false, editing: null, defaultProgramId: "" })}
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-green-700/20">
                  {saving ? <Loader size="sm" /> : <Check className="w-4 h-4" />}
                  <span>{(majorModal.editing as any)._id ? "Save Changes" : "Create Major"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ ENROLL STUDENT IN PROGRAM MODAL ═══════════════ */}
      {enrollModal.open && enrollModal.program && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-700 shrink-0" />
                <span>Enroll Student in Program</span>
              </h3>
              <button onClick={() => setEnrollModal({ open: false, program: null })} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedStudentId) return alert("Select a student to enroll.");
              setEnrolling(true);
              try {
                // Find all courses under this program (common + major courses)
                const prog = enrollModal.program!;
                const courseIds: string[] = [];
                prog.commonSubjects.forEach(s => s._id && courseIds.push(s._id));
                prog.majors.forEach(m => m.subjects.forEach(s => s._id && courseIds.push(s._id)));

                // 1. Approve student & bind to this program (if pending or unassigned)
                try {
                  await lmsService.approveUser(selectedStudentId, prog._id);
                } catch (approveErr) {
                  console.warn("User approval handled or student already approved:", approveErr);
                }

                // 2. Enroll student into all courses of this program
                if (courseIds.length > 0) {
                  await Promise.all(courseIds.map(cId => lmsService.enrollStudent(cId, selectedStudentId)));
                }

                alert(`Student approved and enrolled successfully into ${prog.name}!`);
                setEnrollModal({ open: false, program: null });
                setSelectedStudentId("");
                await fetchAll();
              } catch (err: any) {
                alert(err?.response?.data?.message || err?.message || "Failed to enroll student.");
              } finally {
                setEnrolling(false);
              }
            }}>
              {(() => {
                const targetProgId = enrollModal.program?._id;
                const targetProgName = (enrollModal.program?.name || '').toLowerCase().trim();

                const requestedThisProgram = students.filter(s => {
                  const reqProgId = s.requestedProgramId?._id || s.requestedProgramId || s.programId?._id || s.programId;
                  const reqProgName = (s.requestedProgramId?.name || s.programId?.name || '').toLowerCase().trim();
                  return (reqProgId && reqProgId === targetProgId) || (targetProgName && reqProgName === targetProgName);
                });

                const otherStudents = students.filter(s => !requestedThisProgram.some(r => r._id === s._id));
                const selectedStudent = students.find(s => s._id === selectedStudentId);

                return (
                  <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider block">Target Program</span>
                      <span className="text-sm font-bold text-slate-900">{enrollModal.program.name}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-600">Select Approved Student *</label>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {students.length} student{students.length !== 1 ? 's' : ''} available
                        </span>
                      </div>
                      <select
                        required
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                      >
                        <option value="">Select student...</option>
                        {requestedThisProgram.length > 0 && (
                          <optgroup label="📋 Requested This Program">
                            {requestedThisProgram.map(s => (
                              <option key={s._id} value={s._id}>
                                {s.name} ({s.email}) {s.isApproved === false ? '— [Pending Request]' : '— [Approved]'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {otherStudents.length > 0 && (
                          <optgroup label={requestedThisProgram.length > 0 ? "All Other Registered Students" : "Registered Students"}>
                            {otherStudents.map(s => (
                              <option key={s._id} value={s._id}>
                                {s.name} ({s.email}) {s.isApproved === false ? '— [Pending Request]' : '— [Approved]'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {selectedStudent && (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Student Name:</span>
                          <span className="text-slate-900 font-bold">{selectedStudent.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Email Address:</span>
                          <span className="text-slate-900 font-semibold">{selectedStudent.email}</span>
                        </div>
                        {(selectedStudent.whatsappNumber || selectedStudent.phone) && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Contact:</span>
                            <span className="text-slate-700">{selectedStudent.whatsappNumber || selectedStudent.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Status:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedStudent.isApproved === false
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {selectedStudent.isApproved === false ? 'Pending Approval (Will approve & activate)' : 'Approved & Active'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="flex gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100">
                <button type="button" onClick={() => setEnrollModal({ open: false, program: null })}
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={enrolling}
                  className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-green-700/20">
                  {enrolling ? <Loader size="sm" /> : <Check className="w-4 h-4" />}
                  <span>{enrolling ? "Enrolling..." : "Enroll Student"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ DELETE CONFIRM ═══════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 border border-slate-200">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 text-center mb-1.5 sm:mb-2">Delete {confirmDelete.type === "program" ? "Program" : "Major"}?</h3>
            <p className="text-xs sm:text-sm text-slate-500 text-center mb-5 sm:mb-6">
              Delete <strong>&quot;{confirmDelete.label}&quot;</strong>?
              {confirmDelete.type === "program"
                ? " This will also delete all majors under it. Courses will be unlinked."
                : " Courses under this major will be unlinked."}
            </p>
            <div className="flex gap-2.5 sm:gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
