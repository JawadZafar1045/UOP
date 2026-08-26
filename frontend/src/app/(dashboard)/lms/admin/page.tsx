"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  Shield, BookOpen, Users, GraduationCap, Award, Calendar,
  CheckCircle, XCircle, Trash2, Eye, MoreVertical, Search,
  BarChart3, TrendingUp, UserCheck, UserX, Clock, Check,
  AlertCircle, Plus, Upload, Play, Edit, ArrowRight, Video,
  Layers, DollarSign, Sparkles, Filter, X, Send, Loader2
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import * as lmsService from "@/services/lms.service";

type Tab = "overview" | "registrations" | "courses" | "users" | "certificates";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useStore();

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/lms");
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");

  // Registration Actions State
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Course Builder / Edit Modal State
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState<any>({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    type: "free",
    price: 0,
    currency: "PKR",
    category: "Cyber Security",
    level: "Beginner",
    duration: "4 Hours",
    status: "published",
    isFeatured: false,
    whatYouWillLearn: "",
  });

  // Module & Lecture Builder Modal State
  const [builderCourse, setBuilderCourse] = useState<any>(null);
  const [builderModalOpen, setBuilderModalOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lectureForm, setLectureForm] = useState<any>({
    title: "",
    description: "",
    duration: 600,
    isPreview: false,
    videoUrl: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);

  // Confirm dialogs
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "deactivate" | "activate" | "deleteCourse" | "revokeCert" | "approveUser" | "deleteUser";
    id: string; label: string;
  }>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [s, u, c, ce, r] = await Promise.all([
        lmsService.getAdminStats(),
        lmsService.getAdminUsers(),
        lmsService.getAdminCourses(),
        lmsService.getAdminCertificates(),
        lmsService.getAdminRegistrations(),
      ]);
      setStats(s);
      setUsers(u || []);
      setCourses(c || []);
      setCerts(ce || []);
      setRegistrations(r || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchAllData();
  }, [user]);

  // Filters
  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredCourses = useMemo(() =>
    courses.filter(c =>
      c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.category?.toLowerCase().includes(courseSearch.toLowerCase())
    ), [courses, courseSearch]);

  const filteredRegistrations = useMemo(() =>
    registrations.filter(r =>
      regStatusFilter === "all" ? true : r.status === regStatusFilter
    ), [registrations, regStatusFilter]);

  // ── Registration Handlers ──────────────────────────────────────────────────
  const handleApproveRegistration = async () => {
    if (!selectedReg) return;
    setRegSubmitting(true);
    try {
      await lmsService.approveRegistration(selectedReg._id);
      setApproveModalOpen(false);
      setSelectedReg(null);
      await fetchAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to approve registration.");
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleRejectRegistration = async () => {
    if (!selectedReg) return;
    setRegSubmitting(true);
    try {
      await lmsService.rejectRegistration(selectedReg._id, rejectReason);
      setRejectModalOpen(false);
      setSelectedReg(null);
      setRejectReason("");
      await fetchAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to reject registration.");
    } finally {
      setRegSubmitting(false);
    }
  };

  // ── Course Builder Handlers ────────────────────────────────────────────────
  const handleOpenCourseModal = (courseToEdit: any = null) => {
    if (courseToEdit) {
      setEditingCourse(courseToEdit);
      setCourseForm({
        title: courseToEdit.title || "",
        slug: courseToEdit.slug || "",
        shortDescription: courseToEdit.shortDescription || "",
        description: courseToEdit.description || "",
        type: courseToEdit.type || "free",
        price: courseToEdit.price || 0,
        currency: courseToEdit.currency || "PKR",
        category: courseToEdit.category || "Cyber Security",
        level: courseToEdit.level || "Beginner",
        duration: courseToEdit.duration || "4 Hours",
        status: courseToEdit.status || "published",
        isFeatured: !!courseToEdit.isFeatured,
        whatYouWillLearn: Array.isArray(courseToEdit.whatYouWillLearn)
          ? courseToEdit.whatYouWillLearn.join("\n")
          : "",
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: "",
        slug: "",
        shortDescription: "",
        description: "",
        type: "free",
        price: 0,
        currency: "PKR",
        category: "Cyber Security",
        level: "Beginner",
        duration: "4 Hours",
        status: "published",
        isFeatured: false,
        whatYouWillLearn: "Foundational Security Concepts\nPractical Hands-on Exercises\nIndustry Best Practices",
      });
    }
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...courseForm,
        whatYouWillLearn: courseForm.whatYouWillLearn
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean),
      };

      if (editingCourse) {
        await lmsService.updateCourse(editingCourse._id, payload);
        setCourseModalOpen(false);
        await fetchAllData();
      } else {
        // After creating, jump straight into the Curriculum Builder
        const newCourse = await lmsService.createCourse(payload);
        setCourseModalOpen(false);
        await fetchAllData();
        if (newCourse?._id) {
          handleOpenBuilder(newCourse);
        }
      }
    } catch (err: any) {
      alert(err?.message || "Failed to save course.");
    }
  };

  const handleOpenBuilder = (c: any) => {
    setBuilderCourse(c);
    setBuilderModalOpen(true);
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim() || !builderCourse) return;
    try {
      const updated = await lmsService.addModule(builderCourse._id, { title: newModuleTitle.trim() });
      setBuilderCourse((prev: any) => ({
        ...prev,
        modules: [...(prev.modules || []), updated],
      }));
      setNewModuleTitle("");
      await fetchAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to add module.");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module and its lectures?")) return;
    try {
      await lmsService.deleteModule(builderCourse._id, moduleId);
      setBuilderCourse((prev: any) => ({
        ...prev,
        modules: prev.modules.filter((m: any) => m._id !== moduleId),
      }));
      await fetchAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete module.");
    }
  };

  const handleOpenAddLecture = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setLectureForm({
      title: "",
      description: "",
      duration: 600,
      isPreview: false,
      videoUrl: "",
    });
    setVideoFile(null);
    setLectureModalOpen(true);
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderCourse || !activeModuleId) return;

    setVideoUploading(true);
    try {
      let videoMetadata = undefined;

      if (videoFile) {
        const formData = new FormData();
        formData.append("video", videoFile);
        videoMetadata = await lmsService.uploadLectureVideo(formData);
      } else if (lectureForm.videoUrl?.trim()) {
        const url = lectureForm.videoUrl.trim();
        videoMetadata = {
          provider: url.includes("youtube.com") || url.includes("youtu.be") ? "youtube" : "custom",
          playbackUrl: url,
          contentUrl: url,
        };
      }

      const lecturePayload = {
        ...lectureForm,
        contentUrl: lectureForm.videoUrl?.trim() || "",
        video: videoMetadata,
      };

      const newLecture = await lmsService.addLecture(builderCourse._id, activeModuleId, lecturePayload);

      // Update local builderCourse state
      setBuilderCourse((prev: any) => ({
        ...prev,
        modules: prev.modules.map((m: any) =>
          m._id === activeModuleId
            ? { ...m, lectures: [...(m.lectures || []), newLecture] }
            : m
        ),
      }));

      setLectureModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to add lecture.");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleDeleteLecture = async (moduleId: string, lectureId: string) => {
    if (!confirm("Delete this lecture?")) return;
    try {
      await lmsService.deleteLecture(builderCourse._id, moduleId, lectureId);
      setBuilderCourse((prev: any) => ({
        ...prev,
        modules: prev.modules.map((m: any) =>
          m._id === moduleId
            ? { ...m, lectures: m.lectures.filter((l: any) => l._id !== lectureId) }
            : m
        ),
      }));
      await fetchAllData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete lecture.");
    }
  };

  // ── Existing User & Cert Handlers ──────────────────────────────────────────
  const handleRoleChange = async (id: string, role: string) => {
    try {
      const updated = await lmsService.updateUserRole(id, role);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: updated.role } : u));
    } catch (e: any) {
      alert(e?.message || "Failed to update role.");
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    setIsConfirming(true);
    try {
      if (type === "deactivate") {
        await lmsService.deactivateUser(id);
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: false } : u));
      } else if (type === "activate") {
        await lmsService.activateUser(id);
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: true } : u));
      } else if (type === "approveUser") {
        await lmsService.approveUser(id);
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isApproved: true } : u));
      } else if (type === "deleteUser") {
        await lmsService.deleteUser(id);
        setUsers(prev => prev.filter(u => u._id !== id));
      } else if (type === "deleteCourse") {
        await lmsService.deleteAdminCourse(id);
        setCourses(prev => prev.filter(c => c._id !== id));
      } else if (type === "revokeCert") {
        await lmsService.revokeCertificate(id);
        setCerts(prev => prev.map(c => c._id === id ? { ...c, isRevoked: true } : c));
      }
    } catch (e: any) {
      alert(e?.message || "Action failed.");
    } finally {
      setIsConfirming(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader size="lg" text="Loading CSZone Admin Console..." />
      </div>
    );
  }

  const pendingRegCount = registrations.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-extrabold uppercase tracking-widest mb-1">
            <Shield className="w-4 h-4 animate-pulse-glow" />
            CSZone Administration
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage course catalog, review paid registrations, and configure platform settings.
          </p>
        </div>

        <button
          onClick={() => handleOpenCourseModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-xl shadow-xs hover:shadow-md text-xs sm:text-sm cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Course
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px animate-fade-in-up animation-delay-100">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "registrations", label: "Paid Registrations", icon: DollarSign, badge: pendingRegCount },
          { id: "courses", label: "Courses & Content", icon: BookOpen, count: courses.length },
          { id: "users", label: "Users & RBAC", icon: Users, count: users.length },
          { id: "certificates", label: "Certificates", icon: Award, count: certs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in-up animation-delay-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Published Courses</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{stats?.totalCourses || courses.length}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-3xl font-black text-amber-600">{stats?.pendingRegistrations || pendingRegCount}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Total Students</span>
                <Users className="w-4 h-4 text-blue-700" />
              </div>
              <span className="text-3xl font-black text-slate-900">{stats?.totalStudents || users.length}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
                <span>Total Enrollments</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-blue-600">{stats?.activeEnrollments || 0}</span>
            </div>
          </div>

          {/* Quick Pending Registrations Callout */}
          {pendingRegCount > 0 && (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-900">
                <Clock className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-base">You have {pendingRegCount} pending course registrations</h4>
                  <p className="text-xs text-amber-700">Review student payment references and grant course access.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("registrations")}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Review Registrations
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: Registrations */}
      {activeTab === "registrations" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Paid Course Registrations</h2>
              <p className="text-xs text-slate-500">
                Manually verify fee payments and approve course enrollment for students.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              {["all", "pending", "approved", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setRegStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    regStatusFilter === st
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredRegistrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Course</th>
                    <th className="pb-3 px-3">Tuition</th>
                    <th className="pb-3 px-3">Payment Reference</th>
                    <th className="pb-3 px-3">Applied Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{reg.userId?.name || "Student"}</div>
                        <div className="text-slate-400 text-[11px]">{reg.userId?.email}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {reg.courseId?.title || "Course"}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        PKR {(reg.price || reg.courseId?.price || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {reg.paymentReference || "—"}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            reg.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : reg.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {reg.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedReg(reg); setApproveModalOpen(true); }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setSelectedReg(reg); setRejectModalOpen(true); }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No registrations found matching the selected filter.
            </div>
          )}
        </div>
      )}

      {/* TAB: Courses & Builder */}
      {activeTab === "courses" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              onClick={() => handleOpenCourseModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              New Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => (
              <div key={c._id} className="border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-lg hover:border-blue-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      c.type === "free" ? "bg-blue-100 text-blue-800" : "bg-slate-900 text-white"
                    }`}>
                      {c.type === "free" ? "FREE" : `PAID • PKR ${c.price || 0}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium capitalize">{c.status}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{c.shortDescription || c.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenBuilder(c)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Curriculum Builder
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCourseModal(c)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: "deleteCourse", id: c._id, label: `Delete course "${c.title}"` })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Users */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">User</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold capitalize"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {u.isActive ? (
                        <button
                          onClick={() => setConfirmAction({ type: "deactivate", id: u._id, label: `Deactivate ${u.name}` })}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-bold"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ type: "activate", id: u._id, label: `Activate ${u.name}` })}
                          className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Certificates */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h2 className="text-xl font-black text-slate-900">Issued Certificates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">Student</th>
                  <th className="pb-3 px-3">Course</th>
                  <th className="pb-3 px-3">Certificate #</th>
                  <th className="pb-3 px-3">Issued Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {certs.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 px-3 font-bold text-slate-900">{c.studentId?.name || "Student"}</td>
                    <td className="py-3 px-3">{c.courseId?.title || "Course"}</td>
                    <td className="py-3 px-3 font-mono">{c.certificateNumber}</td>
                    <td className="py-3 px-3 text-slate-400">{new Date(c.issueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isRevoked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {c.isRevoked ? "Revoked" : "Valid"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!c.isRevoked && (
                        <button
                          onClick={() => setConfirmAction({ type: "revokeCert", id: c._id, label: `Revoke certificate ${c.certificateNumber}` })}
                          className="text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg font-bold"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Approve Registration Modal */}
      {approveModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900">Approve Student Enrollment</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to approve enrollment for <strong className="text-slate-900">{selectedReg.userId?.name}</strong> in <strong className="text-slate-900">{selectedReg.courseId?.title}</strong>?
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div><strong>Payment Ref:</strong> {selectedReg.paymentReference || "None"}</div>
              <div><strong>Tuition:</strong> PKR {(selectedReg.price || selectedReg.courseId?.price || 0).toLocaleString()}</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setApproveModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
              <button
                onClick={handleApproveRegistration}
                disabled={regSubmitting}
                className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                {regSubmitting ? "Approving..." : "Confirm & Unlock Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Registration Modal */}
      {rejectModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900">Reject Registration</h3>
            <p className="text-xs text-slate-600">
              Provide a reason for rejecting <strong className="text-slate-900">{selectedReg.userId?.name}</strong>'s application:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid payment reference or eligibility criteria not met..."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
              <button
                onClick={handleRejectRegistration}
                disabled={regSubmitting}
                className="px-5 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
              >
                {regSubmitting ? "Rejecting..." : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Builder Modal (Modules & Lectures) */}
      {builderModalOpen && builderCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Course Builder</span>
                <h3 className="text-xl font-black text-slate-900">{builderCourse.title}</h3>
              </div>
              <button onClick={() => setBuilderModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modules & Lectures Content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              
              {/* Add New Module Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="New Module Title (e.g. Module 1: Introduction to Web Penetration Testing)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={handleAddModule}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>

              {/* Module Tree */}
              <div className="space-y-4">
                {(builderCourse.modules || []).map((mod: any, mIdx: number) => (
                  <div key={mod._id || mIdx} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {mIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{mod.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAddLecture(mod._id)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Lecture
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod._id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lectures List */}
                    <div className="divide-y divide-slate-100 p-2">
                      {(mod.lectures || []).map((lec: any, lIdx: number) => (
                        <div key={lec._id || lIdx} className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Play className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                                <span>{mIdx + 1}.{lIdx + 1} {lec.title}</span>
                                {lec.isPreview && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    FREE PREVIEW
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {lec.duration ? `${Math.round(lec.duration / 60)} mins` : "Duration unset"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteLecture(mod._id, lec._id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Add Lecture Modal */}
      {lectureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900">Add Recorded Lecture</h3>
            <form onSubmit={handleSaveLecture} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lecture Title</label>
                <input
                  type="text"
                  required
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  placeholder="e.g. Setting up Kali Linux and Burp Suite..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lecture Description / Notes</label>
                <textarea
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Duration (Seconds)</label>
                  <input
                    type="number"
                    value={lectureForm.duration}
                    onChange={(e) => setLectureForm({ ...lectureForm, duration: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPreview"
                    checked={lectureForm.isPreview}
                    onChange={(e) => setLectureForm({ ...lectureForm, isPreview: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="isPreview" className="font-bold text-slate-800 cursor-pointer">
                    Enable Free Preview
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Video URL (YouTube / Vimeo / MP4 Link)
                </label>
                <input
                  type="text"
                  value={lectureForm.videoUrl || ""}
                  onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or direct MP4 stream URL"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">Paste a video link OR upload a video file below</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Or Upload Video File (Cloudinary)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLectureModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={videoUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {videoUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Save Lecture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900">
              {editingCourse ? "Edit Course" : "Create New Course"}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g. Certified Ethical Hacker Track"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Course URL Slug <span className="text-[10px] text-slate-400 font-normal">(Auto-generated if left blank)</span>
                  </label>
                  <input
                    type="text"
                    value={courseForm.slug}
                    onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                    placeholder="e.g. cyber-security"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={courseForm.shortDescription}
                  onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })}
                  placeholder="1-2 sentences summarizing the program..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Course Type</label>
                  <select
                    value={courseForm.type}
                    onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="free">Free Course</option>
                    <option value="paid">Paid Track</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price</label>
                  <input
                    type="number"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    disabled={courseForm.type === "free"}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Currency</label>
                  <input
                    type="text"
                    value={courseForm.currency}
                    onChange={(e) => setCourseForm({ ...courseForm, currency: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={courseForm.status}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">What You Will Learn (1 point per line)</label>
                <textarea
                  value={courseForm.whatYouWillLearn}
                  onChange={(e) => setCourseForm({ ...courseForm, whatYouWillLearn: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={courseForm.isFeatured}
                  onChange={(e) => setCourseForm({ ...courseForm, isFeatured: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="isFeatured" className="font-bold text-slate-800 cursor-pointer">
                  Feature this course on Homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-900">Confirm Action</h3>
            <p className="text-xs text-slate-600">{confirmAction.label}?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
              >
                {isConfirming ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
