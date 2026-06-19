"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  Shield, BookOpen, Users, GraduationCap, Award, Calendar,
  CheckCircle, XCircle, Trash2, Eye, MoreVertical, Search,
  BarChart3, TrendingUp, UserCheck, UserX
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import * as lmsService from "@/services/lms.service";

type Tab = "overview" | "users" | "courses" | "certificates";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  // Confirm dialogs
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "deactivate" | "activate" | "deleteCourse" | "revokeCert" | "approveUser" | "deleteUser";
    id: string; label: string;
  }>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, u, c, ce] = await Promise.all([
          lmsService.getAdminStats(),
          lmsService.getAdminUsers(),
          lmsService.getAdminCourses(),
          lmsService.getAdminCertificates(),
        ]);
        setStats(s);
        setUsers(u || []);
        setCourses(c || []);
        setCerts(ce || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredCourses = useMemo(() =>
    courses.filter(c =>
      c.title?.toLowerCase().includes(courseSearch.toLowerCase())
    ), [courses, courseSearch]);

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
      } else if (type === "deleteUser") {
        await lmsService.deleteUser(id);
        setUsers(prev => prev.filter(u => u._id !== id));
      } else if (type === "approveUser") {
        await lmsService.approveUser(id);
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isApproved: true } : u));
      } else if (type === "deleteCourse") {
        await lmsService.deleteAdminCourse(id);
        setCourses(prev => prev.filter(c => c._id !== id));
      } else if (type === "revokeCert") {
        await lmsService.revokeCertificate(id);
        setCerts(prev => prev.map(c => c._id === id ? { ...c, isValid: false } : c));
      }
    } catch (e: any) {
      alert(e?.message || "Action failed.");
    } finally {
      setIsConfirming(false);
      setConfirmAction(null);
    }
  };

  if (!user || user.role !== "admin") return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
    { id: "certificates", label: "Certificates", icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Managing institution{" "}
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-sm">
              {user.tenantId}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { label: "Total Courses", value: stats?.totalCourses ?? "—", icon: <BookOpen className="w-6 h-6" />, color: "blue" },
            { label: "Active Courses", value: stats?.activeCourses ?? "—", icon: <CheckCircle className="w-6 h-6" />, color: "emerald" },
            { label: "Total Students", value: stats?.totalStudents ?? "—", icon: <GraduationCap className="w-6 h-6" />, color: "teal" },
            { label: "Total Teachers", value: stats?.totalTeachers ?? "—", icon: <UserCheck className="w-6 h-6" />, color: "purple" },
            { label: "Certificates Issued", value: stats?.totalCertificates ?? "—", icon: <Award className="w-6 h-6" />, color: "amber" },
            { label: "Total Sessions", value: stats?.totalSessions ?? "—", icon: <Calendar className="w-6 h-6" />, color: "slate" },
          ].map((stat) => (
            <div key={stat.label}
              className={`bg-${stat.color}-50/50 border border-${stat.color}-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{loading ? "..." : stat.value}</p>
                  <p className={`text-[10px] font-bold text-${stat.color}-600 uppercase tracking-widest mt-1`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: USERS ── */}
      {activeTab === "users" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search by name or email..." />
            </div>
            <span className="text-xs text-slate-400 font-medium">{filteredUsers.length} users</span>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><Loader size="md" text="Loading users..." /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Name", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="font-semibold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : u.role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.isActive ? (
                          u.isApproved === false ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {u.isActive && u.isApproved !== false && (
                            <button onClick={() => setConfirmAction({ type: "deactivate", id: u._id, label: u.name })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                              <UserX className="w-3.5 h-3.5" />Deactivate
                            </button>
                          )}
                          {!u.isActive && u.isApproved !== false && (
                            <button onClick={() => setConfirmAction({ type: "activate", id: u._id, label: u.name })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors">
                              <UserCheck className="w-3.5 h-3.5" />Activate
                            </button>
                          )}
                          {(u.role === 'teacher' || u.role === 'student') && u.isApproved === false && (
                            <button onClick={() => setConfirmAction({ type: "approveUser", id: u._id, label: u.name })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors">
                              <UserCheck className="w-3.5 h-3.5" />Approve
                            </button>
                          )}
                          <button onClick={() => setConfirmAction({ type: "deleteUser", id: u._id, label: u.name })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COURSES ── */}
      {activeTab === "courses" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search courses..." />
            </div>
            <span className="text-xs text-slate-400 font-medium">{filteredCourses.length} courses</span>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><Loader size="md" text="Loading courses..." /></div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No courses found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Title", "Teacher", "Students", "Status", "Created", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCourses.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900 max-w-[200px] truncate">{c.title}</td>
                      <td className="px-5 py-4 text-slate-500">{c.instructor?.name || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700">{c.studentCount ?? (c.enrolledStudents?.length ?? 0)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${
                          c.status === "active" || c.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {c.status || "draft"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/lms/courses/${c._id}`}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" />View
                          </Link>
                          <button onClick={() => setConfirmAction({ type: "deleteCourse", id: c._id, label: c.title })}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: CERTIFICATES ── */}
      {activeTab === "certificates" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <span className="text-xs text-slate-400 font-medium">{certs.length} certificates issued</span>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><Loader size="md" text="Loading certificates..." /></div>
          ) : certs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No certificates issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Student", "Course", "Issued Date", "Cert No.", "Valid", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {certs.map(cert => (
                    <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{cert.studentId?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{cert.studentId?.email || ""}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{cert.courseId?.title || "—"}</td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{cert.certificateNumber || "—"}</td>
                      <td className="px-5 py-4">
                        {cert.isValid !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                            <CheckCircle className="w-3 h-3" />Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                            <XCircle className="w-3 h-3" />Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {cert.isValid !== false && (
                          <button onClick={() => setConfirmAction({ type: "revokeCert", id: cert._id, label: `${cert.studentId?.name}'s certificate` })}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                            <XCircle className="w-3.5 h-3.5" />Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIRM DIALOG ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Confirm Action</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              {confirmAction.type === "deactivate" && `Deactivate ${confirmAction.label}? They will lose access.`}
              {confirmAction.type === "activate" && `Activate ${confirmAction.label}? They will regain access.`}
              {confirmAction.type === "deleteUser" && `Delete ${confirmAction.label}? This will permanently remove them from the system.`}
              {confirmAction.type === "approveUser" && `Approve ${confirmAction.label}? They will be notified via email and granted access.`}
              {confirmAction.type === "deleteCourse" && `Delete "${confirmAction.label}"? This will permanently delete all sessions, assignments, quizzes, attendance records and certificates for this course.`}
              {confirmAction.type === "revokeCert" && `Revoke ${confirmAction.label}? This cannot be undone. The verification page will show it as revoked.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={isConfirming}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 ${
                  confirmAction.type === "approveUser" || confirmAction.type === "activate" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}>
                {isConfirming ? <><Loader size="sm" /> Confirming...</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
