"use client";

// Chart.js registration MUST be at the very top
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
} from "chart.js";

// Register all ChartJS components immediately
if (typeof window !== "undefined") {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
    DoughnutController,
  );
}

import { useEffect, useState, use } from "react";
import { useLmsStore } from "@/store/lmsStore";
import { useStore } from "@/store/useStore";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  BookOpen,
  Clock,
  UserPlus,
  XCircle,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import * as lmsService from "@/services/lms.service";
import { useRef } from "react";
import { Edit2, Settings } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function CourseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { currentCourse, isLoading, error, fetchCourse } = useLmsStore();
  const { user } = useStore();
  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [tenantStudents, setTenantStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [togglingStudentId, setTogglingStudentId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    duration: "",
    status: "draft" as "draft" | "active" | "completed",
    completionCriteria: {
      minAttendancePercent: 75,
      minAssignmentScore: 60,
      minQuizScore: 60,
    },
  });
  const { updateCourse } = useLmsStore();
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartInstanceRef = useRef<ChartJS | null>(null);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail) return;
    setIsEnrolling(true);
    try {
      await lmsService.enrollStudent(courseId, studentEmail);
      setShowEnrollModal(false);
      setStudentEmail("");
      fetchCourse(courseId);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to enroll student",
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const loadTenantStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const data = await lmsService.getTenantStudents();
      setTenantStudents(data);
    } catch (err: any) {
      console.error('Failed to load tenant students:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleToggleEnrollment = async (studentId: string, isEnrolled: boolean) => {
    setTogglingStudentId(studentId);
    try {
      if (isEnrolled) {
        await lmsService.unenrollStudent(courseId, studentId);
      } else {
        await lmsService.enrollStudent(courseId, studentId);
      }
      await fetchCourse(courseId);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update enrollment",
      );
    } finally {
      setTogglingStudentId(null);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateCourse(courseId, editFormData);
      setShowEditModal(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update course");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = () => {
    if (!currentCourse) return;
    setEditFormData({
      title: currentCourse.title,
      description: currentCourse.description || "",
      duration: currentCourse.duration || "",
      status: currentCourse.status || "draft",
      completionCriteria: {
        minAttendancePercent: currentCourse.completionCriteria?.minAttendancePercent || 75,
        minAssignmentScore: currentCourse.completionCriteria?.minAssignmentScore || 60,
        minQuizScore: currentCourse.completionCriteria?.minQuizScore || 60,
      },
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchCourse(courseId);
  }, [courseId, fetchCourse]);

  useEffect(() => {
    if (showEnrollModal) {
      loadTenantStudents();
    }
  }, [showEnrollModal]);

  // Doughnut Chart for content distribution
  useEffect(() => {
    if (!currentCourse || !doughnutChartRef.current) return;

    if (doughnutChartInstanceRef.current) {
      doughnutChartInstanceRef.current.destroy();
    }

    const ctx = doughnutChartRef.current.getContext("2d");
    if (!ctx) return;

    try {
      doughnutChartInstanceRef.current = new ChartJS(ctx, {
        type: "doughnut",
        data: {
          labels: ["Sessions", "Assignments", "Quizzes"],
          datasets: [
            {
              data: [
                currentCourse.stats?.sessions || 0,
                currentCourse.stats?.assignments || 0,
                currentCourse.stats?.quizzes || 0,
              ],
              backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { size: 13 },
                color: "#6b7280",
                padding: 15,
                usePointStyle: true,
              },
            },
          },
        } as any,
      });
    } catch (error) {
      console.error("Error creating doughnut chart:", error);
    }

    return () => {
      if (doughnutChartInstanceRef.current) {
        doughnutChartInstanceRef.current.destroy();
      }
    };
  }, [currentCourse]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Loading course..." />
      </div>
    );
  }

  if (error || !currentCourse) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
        <p className="font-medium">{error || "Course not found"}</p>
        <Link
          href="/lms"
          className="mt-3 text-sm text-red-700 underline hover:text-red-800"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  const navigationTabs = [
    {
      name: "Sessions",
      icon: Calendar,
      href: `/lms/courses/${courseId}/sessions`,
      color: "from-blue-600 to-cyan-600",
    },
    {
      name: "Assignments",
      icon: FileText,
      href: `/lms/courses/${courseId}/assignments`,
      color: "from-emerald-600 to-teal-600",
    },
    {
      name: "Quizzes",
      icon: CheckCircle,
      href: `/lms/courses/${courseId}/quiz`,
      color: "from-amber-600 to-orange-600",
    },
    {
      name: "Performance",
      icon: BookOpen,
      href: `/lms/courses/${courseId}/performance`,
      color: "from-purple-600 to-pink-600",
    },
  ];

  if (isTeacherOrAdmin) {
    navigationTabs.push({
      name: "Certificate Designer",
      icon: Edit2,
      href: `/lms/courses/${courseId}/certificate-template`,
      color: "from-indigo-600 to-violet-600",
    });
  }

  return (
    <>
    <div className="flex items-center mb-6">
      <Link
        href="/lms"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all group active:scale-[0.98] shadow-blue-500/20"
      >
        <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
        Back to Courses
      </Link>
    </div>
    <div className="space-y-8">
    
      {/* Abstract Hero Section */}
      <div className="relative w-full min-h-80 rounded-2xl overflow-hidden bg-white border border-slate-200">
        {/* Abstract background patterns */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated background circles */}
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#3b82f6", stopOpacity: 0.1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#8b5cf6", stopOpacity: 0.05 }}
              />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#10b981", stopOpacity: 0.08 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#06b6d4", stopOpacity: 0.05 }}
              />
            </linearGradient>
          </defs>

          {/* Large circles */}
          <circle cx="100" cy="80" r="120" fill="url(#grad1)" />
          <circle cx="1100" cy="320" r="150" fill="url(#grad2)" />

          {/* Wave patterns */}
          <path
            d="M 0 200 Q 300 100 600 200 T 1200 200 L 1200 400 L 0 400 Z"
            fill="#f0f9ff"
            opacity="0.3"
          />

          {/* Floating shapes */}
          <rect
            x="850"
            y="50"
            width="80"
            height="80"
            rx="12"
            fill="url(#grad1)"
            opacity="0.6"
          />
          <polygon
            points="200,350 250,280 300,350"
            fill="url(#grad2)"
            opacity="0.5"
          />
        </svg>

        {/* Content overlay */}
        <div className="relative z-10 h-full p-8 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Status Badge */}
            {isTeacherOrAdmin && (
              <div className="inline-block mb-6">
                <span
                  className={`text-xs font-bold tracking-wider px-3 py-1.5 rounded-full uppercase ${
                    currentCourse.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : currentCourse.status === "draft"
                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                        : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  {currentCourse.status}
                </span>
              </div>
            )}

            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
              {currentCourse.title}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-8">
              {currentCourse.description ||
                "No description provided for this course."}
            </p>
          </div>

          {/* Bottom section with duration and button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-8">
              {currentCourse.duration && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{currentCourse.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-5 h-5" />
                <span className="font-medium">
                  {currentCourse.enrolledStudents?.length || 0} Enrolled
                </span>
              </div>
            </div>

            {isTeacherOrAdmin && (
              <div className="flex gap-3">
                <button
                  onClick={openEditModal}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Settings className="w-5 h-5" />
                  Edit Course
                </button>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  Enroll Student
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action - Course Content Navigation */}
      <div className="space-y-4 mb-2">
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">
          Course Content
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navigationTabs.map((tab) => (
            <Link key={tab.name} href={tab.href}>
              <div className="group bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-slate-300 transition-all h-full cursor-pointer hover:bg-slate-50/50">
                <div
                  className={`w-11 h-11 rounded-lg bg-gradient-to-br ${tab.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <tab.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                  {tab.name}
                </h3>
                <p className="text-xs text-slate-600 group-hover:text-slate-700 transition-colors">
                  {isTeacherOrAdmin
                    ? `Manage ${tab.name.toLowerCase()}`
                    : `View ${tab.name.toLowerCase()}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-8"></div>

      {/* Analytics Section - 4 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Instructor Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-6 flex flex-col hover:shadow-md hover:border-slate-300 transition-all">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            Instructor
          </p>

          <div className="flex flex-col items-center text-center flex-1">
            {/* Avatar with gradient ring */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-md opacity-50"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md border-2 border-white">
                {currentCourse.instructor?.name?.charAt(0) || "I"}
              </div>
            </div>

            {/* Instructor Info */}
            <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
              {currentCourse.instructor?.name || "Unassigned"}
            </h3>
            <p className="text-xs text-slate-500 break-all line-clamp-2 mb-4">
              {currentCourse.instructor?.email || "No email provided"}
            </p>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4"></div>

            {/* Quick Stats */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-600 font-medium">
                    Students
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {currentCourse.enrolledStudents?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-xs text-slate-600 font-medium">
                    Sessions
                  </span>
                </div>
                <span className="text-sm font-bold text-indigo-600">
                  {currentCourse.stats?.sessions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-600 font-medium">
                    Assignments
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {currentCourse.stats?.assignments || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Distribution Chart */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-6 flex flex-col">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            Content Distribution
          </p>
          {(currentCourse.stats?.sessions || 0) + (currentCourse.stats?.assignments || 0) + (currentCourse.stats?.quizzes || 0) === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">No content added yet</p>
              <p className="text-xs text-slate-300">Sessions, assignments and quizzes will appear here</p>
            </div>
          ) : (
            <div style={{ height: "240px", position: "relative", width: "100%", flex: 1 }}>
              <canvas ref={doughnutChartRef} width="300" height="240"></canvas>
            </div>
          )}
        </div>

        {/* Quick Stats - 2 columns */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
            Course Statistics
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">
                {currentCourse.enrolledStudents?.length || 0}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium uppercase leading-tight">
                {isTeacherOrAdmin ? "Students" : "Learners"}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-2xl font-bold text-indigo-600">
                {currentCourse.stats?.sessions || 0}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium uppercase leading-tight">
                Sessions
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-600">
                {currentCourse.stats?.assignments || 0}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium uppercase leading-tight">
                Assignments
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
              <p className="text-2xl font-bold text-rose-600">
                {currentCourse.stats?.quizzes || 0}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium uppercase leading-tight">
                Quizzes
              </p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            {[
              {
                label: "Sessions",
                value: currentCourse.stats?.sessions || 0,
                color: "bg-blue-500",
              },
              {
                label: "Assignments",
                value: currentCourse.stats?.assignments || 0,
                color: "bg-emerald-500",
              },
              {
                label: "Quizzes",
                value: currentCourse.stats?.quizzes || 0,
                color: "bg-rose-500",
              },
            ].map((item) => {
              const total =
                (currentCourse.stats?.sessions || 0) +
                (currentCourse.stats?.assignments || 0) +
                (currentCourse.stats?.quizzes || 0);
              const percentage = Math.round(
                (item.value / Math.max(1, total)) * 100,
              );
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Edit Course Settings</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/80 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Course Title *</label>
                    <input
                      required
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                    <textarea
                      rows={4}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Duration (e.g. 8 Weeks)</label>
                  <input
                    type="text"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Course Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Completion Criteria
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Min Attendance %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editFormData.completionCriteria.minAttendancePercent}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          completionCriteria: { ...editFormData.completionCriteria, minAttendancePercent: parseInt(e.target.value) }
                        })}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Min Assignment Score %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editFormData.completionCriteria.minAssignmentScore}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          completionCriteria: { ...editFormData.completionCriteria, minAssignmentScore: parseInt(e.target.value) }
                        })}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Min Quiz Score %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editFormData.completionCriteria.minQuizScore}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          completionCriteria: { ...editFormData.completionCriteria, minQuizScore: parseInt(e.target.value) }
                        })}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 bg-blue-600 text-sm font-semibold text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  {isUpdating ? <><Loader size="sm" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Course Students
              </h2>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="text-white/80 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left Side: Enroll by Email */}
              <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 shrink-0">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Quick Enroll
                </h3>
                <form onSubmit={handleEnroll} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Student Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white"
                      placeholder="name@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isEnrolling}
                    className="w-full py-2 bg-blue-600 text-sm font-semibold text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex justify-center items-center gap-2"
                  >
                    {isEnrolling ? <><Loader size="sm" /> Enrolling...</> : "Enroll via Email"}
                  </button>
                </form>
              </div>

              {/* Right Side: Student List */}
              <div className="w-full md:w-2/3 p-6 flex flex-col overflow-hidden">
                <h3 className="font-semibold text-slate-800 mb-1">Registered Students</h3>
                <p className="text-xs text-slate-500 mb-4">Students registered in {user?.tenantId || 'this college'}</p>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {isLoadingStudents ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader size="md" text="Loading students..." />
                    </div>
                  ) : tenantStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No students found in this college.
                    </div>
                  ) : (
                    tenantStudents.map((student) => {
                      const isEnrolled = currentCourse?.enrolledStudents?.some((id: any) => 
                        id === student._id || id?._id === student._id || (typeof id === 'string' && id === student._id)
                      );
                      const isToggling = togglingStudentId === student._id;

                      return (
                        <div key={student._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isEnrolled ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isEnrolled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                              {student.name?.charAt(0) || student.email?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-900 truncate">
                                {student.name || "Unnamed Student"}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {student.email}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleToggleEnrollment(student._id, !!isEnrolled)}
                            disabled={isToggling}
                            className={`ml-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                              isEnrolled
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            } disabled:opacity-50`}
                          >
                            {isToggling ? (
                              <Loader size="sm" />
                            ) : isEnrolled ? (
                              "Remove"
                            ) : (
                              "Enroll"
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
