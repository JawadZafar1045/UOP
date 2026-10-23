"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  Shield, BookOpen, Users, GraduationCap, Award, Calendar,
  CheckCircle, XCircle, Trash2, Eye, MoreVertical, Search,
  BarChart3, TrendingUp, UserCheck, UserX, Clock, Check,
  AlertCircle, Plus, Upload, Play, Edit, ArrowRight, Video,
  Layers, DollarSign, Tag, Percent, Sparkles, Filter, X, Send, Loader2, Image as ImageIcon
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import CourseThumbnailUpload from "@/components/ui/CourseThumbnailUpload";
import { formatDuration } from "@/utils/formatDuration";
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
  const [instructors, setInstructors] = useState<any[]>([]);
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
    instructor: "",
    instructorName: "",
    thumbnail: "",
    type: "free",
    price: 0,
    hasDiscount: false,
    discountPrice: 0,
    discountPercent: 0,
    currency: "PKR",
    category: "Certification Bootcamp",
    level: "Beginner",
    duration: "4 Hours",
    startDate: "",
    endDate: "",
    maxStudents: "",
    tags: "",
    completionCriteria: {
      minAttendancePercent: 75,
      minAssignmentScore: 60,
      minQuizScore: 60,
    },
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
      const [s, u, c, ce, r, inst] = await Promise.all([
        lmsService.getAdminStats(),
        lmsService.getAdminUsers(),
        lmsService.getAdminCourses(),
        lmsService.getAdminCertificates(),
        lmsService.getAdminRegistrations(),
        lmsService.getInstructors().catch(() => []),
      ]);
      setStats(s);
      setUsers(u || []);
      setCourses(c || []);
      setCerts(ce || []);
      setRegistrations(r || []);
      setInstructors(inst || []);
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
        instructor: courseToEdit.instructor?._id || courseToEdit.instructor || "",
        instructorName: courseToEdit.instructor?.name || courseToEdit.instructorName || "",
        thumbnail: courseToEdit.thumbnail || "",
        type: courseToEdit.type || "free",
        price: courseToEdit.price || 0,
        hasDiscount: !!courseToEdit.hasDiscount || (Number(courseToEdit.discountPrice) > 0),
        discountPrice: courseToEdit.discountPrice || 0,
        discountPercent: courseToEdit.discountPercent || (courseToEdit.price && courseToEdit.discountPrice ? Math.round(((courseToEdit.price - courseToEdit.discountPrice) / courseToEdit.price) * 100) : 0),
        currency: courseToEdit.currency || "PKR",
        category: courseToEdit.category || "Certification Bootcamp",
        level: courseToEdit.level || "Beginner",
        duration: courseToEdit.duration || "4 Hours",
        startDate: courseToEdit.startDate ? new Date(courseToEdit.startDate).toISOString().split('T')[0] : "",
        endDate: courseToEdit.endDate ? new Date(courseToEdit.endDate).toISOString().split('T')[0] : "",
        maxStudents: courseToEdit.maxStudents || "",
        tags: Array.isArray(courseToEdit.tags) ? courseToEdit.tags.join(", ") : "",
        completionCriteria: {
          minAttendancePercent: courseToEdit.completionCriteria?.minAttendancePercent ?? 75,
          minAssignmentScore: courseToEdit.completionCriteria?.minAssignmentScore ?? 60,
          minQuizScore: courseToEdit.completionCriteria?.minQuizScore ?? 60,
        },
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
        instructor: user?._id || "",
        instructorName: user?.name || "",
        thumbnail: "",
        type: "free",
        price: 0,
        hasDiscount: false,
        discountPrice: 0,
        discountPercent: 0,
        currency: "PKR",
        category: "Certification Bootcamp",
        level: "Beginner",
        duration: "4 Hours",
        startDate: "",
        endDate: "",
        maxStudents: "",
        tags: "",
        completionCriteria: {
          minAttendancePercent: 75,
          minAssignmentScore: 60,
          minQuizScore: 60,
        },
        status: "published",
        isFeatured: false,
        whatYouWillLearn: "",
      });
    }
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        shortDescription: courseForm.shortDescription.trim() || courseForm.description.trim().substring(0, 140),
        instructor: courseForm.instructor || undefined,
        instructorName: courseForm.instructorName || undefined,
        thumbnail: courseForm.thumbnail || "",
        type: courseForm.type,
        price: Number(courseForm.price) || 0,
        hasDiscount: courseForm.type === 'paid' && (!!courseForm.hasDiscount || (Number(courseForm.discountPrice) > 0 && Number(courseForm.discountPrice) < Number(courseForm.price))),
        discountPrice: courseForm.type === 'paid' && (!!courseForm.hasDiscount || (Number(courseForm.discountPrice) > 0 && Number(courseForm.discountPrice) < Number(courseForm.price))) ? Number(courseForm.discountPrice || 0) : 0,
        discountPercent: courseForm.type === 'paid' && (!!courseForm.hasDiscount || (Number(courseForm.discountPrice) > 0 && Number(courseForm.discountPrice) < Number(courseForm.price))) ? (Number(courseForm.discountPercent) || (Number(courseForm.price) ? Math.round(((Number(courseForm.price) - Number(courseForm.discountPrice)) / Number(courseForm.price)) * 100) : 0)) : 0,
        currency: courseForm.currency || "PKR",
        category: courseForm.category,
        level: courseForm.level,
        duration: courseForm.duration || "4 Hours",
        startDate: courseForm.startDate || undefined,
        endDate: courseForm.endDate || undefined,
        maxStudents: courseForm.maxStudents ? Number(courseForm.maxStudents) : undefined,
        tags: typeof courseForm.tags === 'string'
          ? courseForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : courseForm.tags,
        completionCriteria: courseForm.completionCriteria,
        status: courseForm.status,
        isFeatured: !!courseForm.isFeatured,
        whatYouWillLearn: typeof courseForm.whatYouWillLearn === 'string'
          ? courseForm.whatYouWillLearn.split("\n").map((s: string) => s.trim()).filter(Boolean)
          : courseForm.whatYouWillLearn,
      };

      if (courseForm.slug?.trim()) {
        payload.slug = courseForm.slug.trim();
      }

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
      duration: 0,
      isPreview: false,
      videoUrl: "",
    });
    setVideoFile(null);
    setLectureModalOpen(true);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    if (file) {
      try {
        const videoElem = document.createElement("video");
        videoElem.preload = "metadata";
        videoElem.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoElem.src);
          const exactDuration = Math.round(videoElem.duration || 0);
          if (exactDuration > 0) {
            setLectureForm((prev: any) => ({ ...prev, duration: exactDuration }));
          }
        };
        videoElem.src = URL.createObjectURL(file);
      } catch (err) {
        console.warn("Could not extract local video duration:", err);
      }
    }
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderCourse || !activeModuleId) return;

    setVideoUploading(true);
    try {
      let videoMetadata: any = undefined;

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

      const exactDuration = (videoMetadata && typeof videoMetadata.duration === 'number' && videoMetadata.duration > 0)
        ? Math.round(videoMetadata.duration)
        : (Number(lectureForm.duration) || 0);

      const lecturePayload = {
        ...lectureForm,
        duration: exactDuration,
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
        <Loader size="lg" text="Loading School of Information Security Admin Console..." />
      </div>
    );
  }

  const pendingRegCount = registrations.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <div className="flex items-center gap-2 text-[#0E8696] text-xs font-extrabold uppercase tracking-widest mb-1">
            <Shield className="w-4 h-4 animate-pulse-glow" />
            School of Information Security Administration
          </div>
          <h1 className="text-3xl font-black text-[#021F37] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-[#4d6477] mt-0.5">
            Manage course catalog, review paid registrations, and configure platform settings.
          </p>
        </div>

        <button
          onClick={() => handleOpenCourseModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-extrabold rounded-xl shadow-xs hover:shadow-md text-xs sm:text-sm cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Course
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d5e0e8] overflow-x-auto pb-px animate-fade-in-up animation-delay-100">
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
                  ? "border-[#0E8696] text-[#0E8696]"
                  : "border-transparent text-[#4d6477] hover:text-[#021F37] hover:border-slate-300"
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
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-[#4d6477]">
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
            <div className="p-6 bg-white rounded-2xl border border-[#d5e0e8]/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-[#4d6477] text-xs font-bold uppercase mb-2">
                <span>Published Courses</span>
                <BookOpen className="w-4 h-4 text-[#0E8696]" />
              </div>
              <span className="text-3xl font-black text-[#021F37]">{stats?.totalCourses || courses.length}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-[#d5e0e8]/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-[#4d6477] text-xs font-bold uppercase mb-2">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-3xl font-black text-amber-600">{stats?.pendingRegistrations || pendingRegCount}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-[#d5e0e8]/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-[#4d6477] text-xs font-bold uppercase mb-2">
                <span>Total Students</span>
                <Users className="w-4 h-4 text-[#0b6f7c]" />
              </div>
              <span className="text-3xl font-black text-[#021F37]">{stats?.totalStudents || users.length}</span>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-[#d5e0e8]/80 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-[#4d6477] text-xs font-bold uppercase mb-2">
                <span>Total Enrollments</span>
                <TrendingUp className="w-4 h-4 text-[#0E8696]" />
              </div>
              <span className="text-3xl font-black text-[#0E8696]">{stats?.activeEnrollments || 0}</span>
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
        <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#021F37]">Paid Course Registrations</h2>
              <p className="text-xs text-[#4d6477]">
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
                      ? "bg-white text-[#021F37] shadow-xs"
                      : "text-[#4d6477] hover:text-[#021F37]"
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
                  <tr className="border-b border-[#d5e0e8] text-[#5f7587] font-bold uppercase text-[10px]">
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Course</th>
                    <th className="pb-3 px-3">Tuition</th>
                    <th className="pb-3 px-3">Payment Reference</th>
                    <th className="pb-3 px-3">Applied Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#021F37]">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className="hover:bg-[#f4f8fb]/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#021F37]">{reg.userId?.name || "Student"}</div>
                        <div className="text-[#5f7587] text-[11px]">{reg.userId?.email}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#021F37]">
                        {reg.courseId?.title || "Course"}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#021F37]">
                        PKR {(reg.price || reg.courseId?.price || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-[#4d6477]">
                        {reg.paymentReference || "—"}
                      </td>
                      <td className="py-3.5 px-3 text-[#4d6477] text-[11px]">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            reg.status === "approved"
                              ? "bg-green-100 text-green-700"
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
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
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
                          <span className="text-[#5f7587] text-[11px]">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#5f7587] text-xs">
              No registrations found matching the selected filter.
            </div>
          )}
        </div>
      )}

      {/* TAB: Courses & Builder */}
      {activeTab === "courses" && (
        <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-[#5f7587] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-4 py-2 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs text-[#021F37] focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
              />
            </div>

            <button
              onClick={() => handleOpenCourseModal()}
              className="px-4 py-2 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              New Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => {
              const instructorName = c.instructor?.name || c.instructorName;
              const isFree = c.type === "free";

              return (
                <div
                  key={c._id}
                  className="bg-white border border-[#d5e0e8]/90 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-[#9fd4db] transition-all group"
                >
                  {/* Thumbnail / Header Banner */}
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 via-[#f4f8fb] to-slate-200 flex flex-col items-center justify-center text-[#4d6477] p-4 relative select-none">
                        <BookOpen className="w-8 h-8 text-[#0E8696] mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#4d6477]">
                          {c.category || "Course"}
                        </span>
                      </div>
                    )}

                    {/* Floating Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5">
                      {c.hasDiscount && c.discountPrice > 0 ? (
                        <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs">
                          <span>{c.currency || "PKR"} {Number(c.discountPrice).toLocaleString()}</span>
                          <span className="line-through text-emerald-200 text-[9px] font-semibold opacity-90">{Number(c.price || 0).toLocaleString()}</span>
                          {c.discountPercent > 0 && <span className="bg-emerald-800 text-white px-1 rounded text-[8px]">-{c.discountPercent}%</span>}
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isFree ? "bg-[#0b6f7c] text-white" : "bg-slate-900 text-white"
                        }`}>
                          {isFree ? "FREE" : `${c.currency || "PKR"} ${(c.price || 0).toLocaleString()}`}
                        </span>
                      )}

                      {c.isFeatured && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize shadow-xs ${
                        c.status === "published" || c.status === "active"
                          ? "bg-green-500 text-white"
                          : c.status === "draft"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-700 text-white"
                      }`}>
                        {c.status || "draft"}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-md text-[#021F37] border border-[#d5e0e8]/80">
                        {c.category || "General"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-md text-[#021F37] border border-[#d5e0e8]/80">
                        {c.level || "Beginner"}
                      </span>
                    </div>
                  </div>

                  {/* Course Details Content */}
                  <div className="p-5 space-y-4 flex-1">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-[#021F37] text-base line-clamp-1 group-hover:text-[#0E8696] transition-colors">
                        {c.title}
                      </h3>
                      {c.slug && (
                        <p className="text-[11px] font-mono text-[#5f7587] truncate">
                          /courses/{c.slug}
                        </p>
                      )}
                      <p className="text-xs text-[#4d6477] line-clamp-2 leading-relaxed pt-1">
                        {c.shortDescription || c.description || "No description provided."}
                      </p>
                    </div>

                    {/* Instructor Row (Shown ONLY if selected/assigned) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      {instructorName ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#f4f8fb] text-[#0b6f7c] border border-[#d5e0e8] font-black text-[10px] flex items-center justify-center shrink-0">
                            {instructorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-[#5f7587] block uppercase font-bold tracking-wider leading-none">Instructor</span>
                            <span className="font-bold text-[#021F37] text-xs truncate block">{instructorName}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#5f7587] italic">No instructor assigned</span>
                      )}

                      {c.duration && (
                        <span className="text-[11px] font-semibold text-[#4d6477] bg-[#f4f8fb] px-2 py-0.5 rounded-md border border-[#d5e0e8] shrink-0">
                          {c.duration}
                        </span>
                      )}
                    </div>

                    {/* Schedule & Capacity Metrics */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#f4f8fb] border border-slate-100 rounded-xl text-[11px] text-[#4d6477]">
                      <div>
                        <span className="text-[#5f7587] block text-[10px] font-bold uppercase">Students</span>
                        <span className="font-extrabold text-[#021F37]">
                          {c.studentCount || 0}
                          {c.maxStudents ? ` / ${c.maxStudents}` : " (Unlimited)"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#5f7587] block text-[10px] font-bold uppercase">Curriculum</span>
                        <span className="font-extrabold text-[#021F37]">
                          {c.moduleCount || 0} Mods • {c.lectureCount || 0} Lecs
                        </span>
                      </div>

                      {(c.startDate || c.endDate) && (
                        <div className="col-span-2 pt-1 border-t border-[#d5e0e8]/60 flex items-center justify-between text-[10px]">
                          <span className="text-[#5f7587] font-bold uppercase">Term:</span>
                          <span className="text-[#021F37] font-semibold">
                            {c.startDate ? new Date(c.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Anytime"}
                            {" → "}
                            {c.endDate ? new Date(c.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Open"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {Array.isArray(c.tags) && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#f4f8fb] text-[#0b6f7c] text-[10px] font-bold rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-3 border-t border-slate-100 bg-[#f4f8fb]/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenBuilder(c)}
                      className="flex-1 px-3.5 py-2 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Curriculum
                    </button>

                    <button
                      onClick={() => handleOpenCourseModal(c)}
                      className="p-2 text-[#4d6477] hover:text-[#0E8696] hover:bg-[#f4f8fb] bg-white border border-[#d5e0e8] rounded-xl cursor-pointer transition-colors shadow-xs"
                      title="Edit Course Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setConfirmAction({ type: "deleteCourse", id: c._id, label: `Delete course "${c.title}"` })}
                      className="p-2 text-[#5f7587] hover:text-red-600 hover:bg-red-50 bg-white border border-[#d5e0e8] rounded-xl cursor-pointer transition-colors shadow-xs"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Users */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 shadow-xs space-y-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#5f7587] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs text-[#021F37] focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d5e0e8] text-[#5f7587] font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">User</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#021F37]">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-[#f4f8fb]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#021F37]">{u.name}</div>
                      <div className="text-[#5f7587] text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="px-2.5 py-1 bg-[#f4f8fb] border border-[#d5e0e8] rounded-lg text-xs font-bold capitalize"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                          className="px-2.5 py-1 text-green-600 hover:bg-green-50 rounded-lg font-bold"
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
        <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 shadow-xs space-y-6">
          <h2 className="text-xl font-black text-[#021F37]">Issued Certificates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d5e0e8] text-[#5f7587] font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">Student</th>
                  <th className="pb-3 px-3">Course</th>
                  <th className="pb-3 px-3">Certificate #</th>
                  <th className="pb-3 px-3">Issued Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#021F37]">
                {certs.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 px-3 font-bold text-[#021F37]">{c.studentId?.name || "Student"}</td>
                    <td className="py-3 px-3">{c.courseId?.title || "Course"}</td>
                    <td className="py-3 px-3 font-mono">{c.certificateNumber}</td>
                    <td className="py-3 px-3 text-[#5f7587]">{new Date(c.issueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isRevoked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
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
      {/* Approve Registration Modal */}
      {approveModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#d5e0e8] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#021F37]">Accept & Unlock Course</h3>
                <p className="text-xs text-[#4d6477]">Grant full student access and send confirmation email</p>
              </div>
            </div>

            <p className="text-xs text-[#4d6477] leading-relaxed">
              Are you sure you want to approve enrollment for <strong className="text-[#021F37] font-bold">{selectedReg.userId?.name}</strong>?
            </p>

            <div className="bg-[#f4f8fb] border border-[#d5e0e8]/80 p-4 rounded-2xl text-xs space-y-2 text-[#4d6477]">
              <div className="flex justify-between">
                <span>Student:</span>
                <strong className="text-[#021F37] font-bold">{selectedReg.userId?.name} ({selectedReg.userId?.email})</strong>
              </div>
              <div className="flex justify-between">
                <span>Course:</span>
                <strong className="text-[#021F37] font-bold">{selectedReg.courseId?.title}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tuition:</span>
                <strong className="text-[#021F37] font-bold">PKR {(selectedReg.price || selectedReg.courseId?.price || 0).toLocaleString()}</strong>
              </div>
              {selectedReg.paymentReference && (
                <div className="flex justify-between">
                  <span>Payment Ref:</span>
                  <span className="font-mono text-[#021F37] font-bold">{selectedReg.paymentReference}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-[#4d6477] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveRegistration}
                disabled={regSubmitting}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {regSubmitting ? "Approving & Sending Email..." : "Accept & Unlock Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Registration Modal */}
      {rejectModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#d5e0e8] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#021F37]">Decline Student Request</h3>
                <p className="text-xs text-[#4d6477]">Reject request and notify student with reason</p>
              </div>
            </div>

            <p className="text-xs text-[#4d6477] leading-relaxed">
              Decline enrollment request for <strong className="text-[#021F37] font-bold">{selectedReg.userId?.name}</strong> in <strong className="text-[#021F37] font-bold">{selectedReg.courseId?.title}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#021F37] block">
                Decline Reason (Sent to Student via Email)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid payment transaction ID or fee transfer not received..."
                rows={3}
                className="w-full p-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-[#4d6477] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRegistration}
                disabled={regSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {regSubmitting ? "Declining..." : "Decline Request"}
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
                <span className="text-xs font-bold text-[#0E8696] uppercase tracking-widest">Course Builder</span>
                <h3 className="text-xl font-black text-[#021F37]">{builderCourse.title}</h3>
              </div>
              <button onClick={() => setBuilderModalOpen(false)} className="p-2 text-[#5f7587] hover:text-[#4d6477] rounded-lg">
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
                  className="flex-1 px-4 py-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
                />
                <button
                  onClick={handleAddModule}
                  className="px-4 py-2.5 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>

              {/* Module Tree */}
              <div className="space-y-4">
                {(builderCourse.modules || []).map((mod: any, mIdx: number) => (
                  <div key={mod._id || mIdx} className="border border-[#d5e0e8] rounded-2xl overflow-hidden">
                    <div className="p-4 bg-[#f4f8fb] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#eaf3f7] text-[#0b6f7c] font-bold text-xs flex items-center justify-center">
                          {mIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-[#021F37]">{mod.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAddLecture(mod._id)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-[#d5e0e8] text-[#021F37] font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Lecture
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod._id)}
                          className="p-1 text-[#5f7587] hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lectures List */}
                    <div className="divide-y divide-slate-100 p-2">
                      {(mod.lectures || []).map((lec: any, lIdx: number) => (
                        <div key={lec._id || lIdx} className="p-3 flex items-center justify-between hover:bg-[#f4f8fb] rounded-xl">
                          <div className="flex items-center gap-3">
                            <Play className="w-4 h-4 text-[#5f7587]" />
                            <div>
                              <div className="font-semibold text-xs text-[#021F37] flex items-center gap-2">
                                <span>{mIdx + 1}.{lIdx + 1} {lec.title}</span>
                                {lec.isPreview && (
                                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                                    FREE PREVIEW
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#5f7587]">
                                {lec.duration ? formatDuration(lec.duration) : "Duration unset"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteLecture(mod._id, lec._id)}
                            className="p-1 text-[#5f7587] hover:text-red-600 rounded-lg cursor-pointer"
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
            <h3 className="text-lg font-black text-[#021F37]">Add Recorded Lecture</h3>
            <form onSubmit={handleSaveLecture} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#021F37] block mb-1">Lecture Title</label>
                <input
                  type="text"
                  required
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  placeholder="e.g. Setting up Kali Linux and Burp Suite..."
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
                />
              </div>

              <div>
                <label className="font-bold text-[#021F37] block mb-1">Lecture Description / Notes</label>
                <textarea
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">
                    Duration (Seconds) {lectureForm.duration > 0 && <span className="text-[#0E8696] font-semibold ml-1">({formatDuration(lectureForm.duration)})</span>}
                  </label>
                  <input
                    type="number"
                    value={lectureForm.duration || ""}
                    placeholder="Auto-detected from video"
                    onChange={(e) => setLectureForm({ ...lectureForm, duration: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPreview"
                    checked={lectureForm.isPreview}
                    onChange={(e) => setLectureForm({ ...lectureForm, isPreview: e.target.checked })}
                    className="rounded text-[#0E8696] focus:ring-[#0E8696] w-4 h-4"
                  />
                  <label htmlFor="isPreview" className="font-bold text-[#021F37] cursor-pointer">
                    Enable Free Preview
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#021F37] block mb-1">
                  Video URL (YouTube / Vimeo / MP4 Link)
                </label>
                <input
                  type="text"
                  value={lectureForm.videoUrl || ""}
                  onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or direct MP4 stream URL"
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-mono text-xs focus:outline-none focus:border-[#0E8696] focus:ring-2 focus:ring-[#0E8696]/20"
                />
                <p className="text-[10px] text-[#5f7587] mt-1">Paste a video link OR upload a video file below</p>
              </div>

              <div>
                <label className="font-bold text-[#021F37] block mb-1">Or Upload Video File (Cloudinary)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full text-xs text-[#4d6477] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#f4f8fb] file:text-[#0b6f7c] hover:file:bg-[#eaf3f7] cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLectureModalOpen(false)}
                  className="px-4 py-2 text-[#4d6477] font-bold hover:bg-[#f4f8fb] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={videoUploading}
                  className="px-5 py-2 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
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
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-[#021F37]">
                {editingCourse ? "Edit Course" : "Create New Course"}
              </h3>
              <button
                onClick={() => setCourseModalOpen(false)}
                className="p-1.5 text-[#5f7587] hover:text-[#4d6477] rounded-xl hover:bg-[#f4f8fb] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCourseForm((prev: any) => ({
                        ...prev,
                        title: val,
                        slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                      }));
                    }}
                    placeholder="e.g. Certified Ethical Hacker Track"
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">
                    Course URL Slug <span className="text-[10px] text-[#5f7587] font-normal">(e.g. /courses/slug)</span>
                  </label>
                  <input
                    type="text"
                    value={courseForm.slug}
                    onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="e.g. ethical-hacking-track"
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Lead Instructor Dropdown */}
              <div>
                <label className="font-bold text-[#021F37] block mb-1">
                  Lead Instructor <span className="text-[10px] text-[#5f7587] font-normal">(Select registered faculty)</span>
                </label>
                <select
                  value={courseForm.instructor}
                  onChange={(e) => {
                    const instId = e.target.value;
                    const match = instructors.find((i: any) => i._id === instId);
                    setCourseForm({
                      ...courseForm,
                      instructor: instId,
                      instructorName: match ? match.name : "",
                    });
                  }}
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-medium cursor-pointer"
                >
                  <option value="">-- No Instructor Assigned --</option>
                  {instructors.map((inst: any) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.role.toUpperCase()} • {inst.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Thumbnail Management */}
              <div className="p-4 bg-[#f4f8fb]/80 border border-[#d5e0e8]/80 rounded-2xl">
                <CourseThumbnailUpload
                  value={courseForm.thumbnail}
                  onChange={(url) => setCourseForm((prev: any) => ({ ...prev, thumbnail: url }))}
                />
              </div>

              {/* Short & Full Description */}
              <div>
                <label className="font-bold text-[#021F37] block mb-1">Short Description / Tagline</label>
                <input
                  type="text"
                  value={courseForm.shortDescription}
                  onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })}
                  placeholder="1-2 sentences summarizing the program for catalog cards..."
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-[#021F37] block mb-1">Full Description *</label>
                <textarea
                  required
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl resize-none"
                  placeholder="Comprehensive syllabus overview, prerequisites, and learning objectives..."
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Course Type</label>
                  <select
                    value={courseForm.type}
                    onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value, price: e.target.value === 'free' ? 0 : courseForm.price })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-bold cursor-pointer"
                  >
                    <option value="free">Free Course</option>
                    <option value="paid">Paid Track</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Price</label>
                  <input
                    type="number"
                    min={0}
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    disabled={courseForm.type === "free"}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Currency</label>
                  <input
                    type="text"
                    value={courseForm.currency}
                    onChange={(e) => setCourseForm({ ...courseForm, currency: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl"
                  />
                </div>
              </div>

              {/* Promotional Discount (Only for Paid Courses) */}
              {courseForm.type === "paid" && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!courseForm.hasDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const currentPrice = Number(courseForm.price) || 0;
                          const defaultDiscount = currentPrice > 0 ? Math.round(currentPrice * 0.8) : 0;
                          setCourseForm({
                            ...courseForm,
                            hasDiscount: checked,
                            discountPrice: checked ? (courseForm.discountPrice > 0 ? courseForm.discountPrice : defaultDiscount) : 0,
                            discountPercent: checked ? (courseForm.discountPercent > 0 ? courseForm.discountPercent : 20) : 0,
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded border-[#d5e0e8] focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        Apply Promotional Discount
                      </span>
                    </label>

                    {courseForm.hasDiscount && courseForm.discountPercent > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md shadow-xs flex items-center gap-1">
                        <Percent className="w-2.5 h-2.5" />
                        {courseForm.discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {courseForm.hasDiscount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-[#021F37] block mb-1">
                          Discounted Price ({courseForm.currency})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={courseForm.discountPrice}
                          onChange={(e) => {
                            const newDiscountPrice = Number(e.target.value);
                            const origPrice = Number(courseForm.price) || 0;
                            const pct = origPrice > 0 && newDiscountPrice < origPrice
                              ? Math.max(0, Math.min(100, Math.round(((origPrice - newDiscountPrice) / origPrice) * 100)))
                              : 0;
                            setCourseForm({
                              ...courseForm,
                              discountPrice: newDiscountPrice,
                              discountPercent: pct,
                            });
                          }}
                          placeholder="e.g. 24999"
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <span className="text-[10px] text-emerald-700 mt-1 block">
                          Final amount the student pays
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#021F37] block mb-1">
                          Discount Percentage (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={courseForm.discountPercent}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const origPrice = Number(courseForm.price) || 0;
                            const newPrice = origPrice > 0 ? Math.round(origPrice * (1 - pct / 100)) : 0;
                            setCourseForm({
                              ...courseForm,
                              discountPercent: pct,
                              discountPrice: newPrice,
                            });
                          }}
                          placeholder="e.g. 20"
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <span className="text-[10px] text-emerald-700 mt-1 block">
                          Auto-computes discounted price from {courseForm.price || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category, Level & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-medium cursor-pointer"
                  >
                    {["Certification Bootcamp", "Specialized Courses", "Customized Training", "Law Enforcement Agencies"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-bold cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All levels">All levels</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Status</label>
                  <select
                    value={courseForm.status}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl font-bold cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Duration, Capacity & Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Duration</label>
                  <input
                    type="text"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    placeholder="e.g. 4 Hours / 8 Weeks"
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Max Students</label>
                  <input
                    type="number"
                    min={1}
                    value={courseForm.maxStudents}
                    onChange={(e) => setCourseForm({ ...courseForm, maxStudents: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#021F37] block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={courseForm.startDate}
                    onChange={(e) => setCourseForm({ ...courseForm, startDate: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#021F37] block mb-1">End Date</label>
                  <input
                    type="date"
                    value={courseForm.endDate}
                    onChange={(e) => setCourseForm({ ...courseForm, endDate: e.target.value })}
                    className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Completion Criteria */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#f4f8fb] border border-[#d5e0e8]/80 rounded-2xl">
                <div>
                  <label className="font-bold text-[#021F37] block text-[11px] mb-1">Min Attendance (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={courseForm.completionCriteria?.minAttendancePercent ?? 75}
                    onChange={(e) => setCourseForm({
                      ...courseForm,
                      completionCriteria: { ...courseForm.completionCriteria, minAttendancePercent: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-white border border-[#d5e0e8] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#021F37] block text-[11px] mb-1">Min Assignment (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={courseForm.completionCriteria?.minAssignmentScore ?? 60}
                    onChange={(e) => setCourseForm({
                      ...courseForm,
                      completionCriteria: { ...courseForm.completionCriteria, minAssignmentScore: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-white border border-[#d5e0e8] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#021F37] block text-[11px] mb-1">Min Quiz Pass (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={courseForm.completionCriteria?.minQuizScore ?? 60}
                    onChange={(e) => setCourseForm({
                      ...courseForm,
                      completionCriteria: { ...courseForm.completionCriteria, minQuizScore: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-white border border-[#d5e0e8] rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="font-bold text-[#021F37] block mb-1">Topic Tags (comma-separated)</label>
                <input
                  type="text"
                  value={courseForm.tags}
                  onChange={(e) => setCourseForm({ ...courseForm, tags: e.target.value })}
                  placeholder="e.g. cybersecurity, linux, networking, python"
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl"
                />
              </div>

              {/* What You Will Learn */}
              <div>
                <label className="font-bold text-[#021F37] block mb-1">What You Will Learn (1 point per line)</label>
                <textarea
                  value={courseForm.whatYouWillLearn}
                  onChange={(e) => setCourseForm({ ...courseForm, whatYouWillLearn: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl"
                  placeholder="Key student learning outcomes..."
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={courseForm.isFeatured}
                  onChange={(e) => setCourseForm({ ...courseForm, isFeatured: e.target.checked })}
                  className="rounded text-[#0E8696] focus:ring-[#0E8696] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="font-bold text-[#021F37] cursor-pointer text-xs">
                  Feature this course on Platform Homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 text-[#4d6477] font-bold hover:bg-[#f4f8fb] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
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
            <h3 className="text-base font-black text-[#021F37]">Confirm Action</h3>
            <p className="text-xs text-[#4d6477]">{confirmAction.label}?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-xs font-bold text-[#4d6477]"
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
