"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
  Shield, BookOpen, Users, GraduationCap, Award, Calendar,
  CheckCircle, XCircle, Trash2, Eye, MoreVertical, Search,
  BarChart3, TrendingUp, UserCheck, UserX, Phone, MapPin,
  Briefcase, Mail, X
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import * as lmsService from "@/services/lms.service";

type Tab = "overview" | "users" | "courses" | "certificates";

type FilterOption = {
  id: "all" | "pending" | "active" | "inactive";
  label: string;
  highlight?: boolean;
};

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
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "pending" | "active" | "inactive">("all");

  // Applicant details modal
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [assignedProgramId, setAssignedProgramId] = useState<string>("");

  // Confirm dialogs
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "deactivate" | "activate" | "deleteCourse" | "revokeCert" | "approveUser" | "deleteUser";
    id: string; label: string; programId?: string;
  }>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, u, c, ce, pr] = await Promise.all([
          lmsService.getAdminStats(),
          lmsService.getAdminUsers(),
          lmsService.getAdminCourses(),
          lmsService.getAdminCertificates(),
          lmsService.getPrograms(),
        ]);
        setStats(s);
        setUsers(u || []);
        setCourses(c || []);
        setCerts(ce || []);
        setPrograms(pr || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const pendingUsersCount = useMemo(() => users.filter(u => u.isApproved === false).length, [users]);

  const filteredUsers = useMemo(() =>
    users.filter(u => {
      const matchesSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (userStatusFilter === "pending") return u.isApproved === false;
      if (userStatusFilter === "active") return u.isActive && u.isApproved !== false;
      if (userStatusFilter === "inactive") return !u.isActive;
      return true;
    }), [users, userSearch, userStatusFilter]);

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
        await lmsService.approveUser(id, confirmAction.programId);
        setUsers(prev => prev.map(u => u._id === id ? { 
          ...u, 
          isApproved: true, 
          isActive: true,
          programId: programs.find(p => p._id === confirmAction.programId) || u.programId
        } : u));
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

  const filterOptions: FilterOption[] = [
    { id: "all", label: `All (${users.length})` },
    { id: "pending", label: `Pending (${pendingUsersCount})`, highlight: pendingUsersCount > 0 },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-700" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Managing institution{" "}
            <span className="font-bold text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg text-sm">
              {user.tenantId}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-green-700 text-white shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { label: "Total Courses", value: stats?.totalCourses ?? "—", icon: <BookOpen className="w-6 h-6" /> },
            { label: "Active Courses", value: stats?.activeCourses ?? "—", icon: <CheckCircle className="w-6 h-6" /> },
            { label: "Total Students", value: stats?.totalStudents ?? "—", icon: <GraduationCap className="w-6 h-6" /> },
            { label: "Total Teachers", value: stats?.totalTeachers ?? "—", icon: <UserCheck className="w-6 h-6" /> },
            { label: "Certificates Issued", value: stats?.totalCertificates ?? "—", icon: <Award className="w-6 h-6" /> },
            { label: "Total Sessions", value: stats?.totalSessions ?? "—", icon: <Calendar className="w-6 h-6" /> },
          ].map((stat) => (
            <div key={stat.label}
              className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center text-green-700">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{loading ? "..." : stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: USERS ── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Pending Approval Notice Banner */}
          {pendingUsersCount > 0 && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold">
                  {pendingUsersCount}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {pendingUsersCount} Pending Registration {pendingUsersCount === 1 ? 'Request' : 'Requests'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    New students or teachers have registered and are waiting for your approval to log in.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserStatusFilter("pending")}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
              >
                View Pending Requests
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Search by name or email..." />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {filterOptions.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userStatusFilter === f.id
                        ? "bg-green-700 text-white shadow-sm"
                        : f.highlight
                        ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center"><Loader size="md" text="Loading users..." /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No users found matching current criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Applicant / Name", "Email & WhatsApp", "Academic Track", "Status", "Applied", "Actions"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(u => (
                      <tr key={u._id} className={`hover:bg-slate-50/50 transition-colors ${u.isApproved === false ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-800 font-bold text-xs">
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">{u.name}</span>
                              {u.district && (
                                <span className="text-[11px] text-slate-400 font-medium">📍 {u.district}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-600 text-xs font-medium">{u.email}</div>
                          {(u.whatsappNumber || u.phone) && (
                            <div className="text-green-700 font-bold text-[11px] mt-0.5">
                              📞 {u.whatsappNumber || u.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-xs text-slate-800">
                              {u.requestedProgramId?.name || u.programId?.name || "General Track"}
                            </span>
                            {u.degreeQualification && (
                              <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                🎓 {u.degreeQualification}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {u.isActive ? (
                            u.isApproved === false ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Pending Approval
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-800 text-xs font-bold rounded-full border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600" />Active
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
                            <button
                              onClick={() => {
                                setSelectedApplicant(u);
                                const initProgId = u.requestedProgramId?._id || u.requestedProgramId || u.programId?._id || u.programId || (programs[0]?._id || "");
                                setAssignedProgramId(initProgId);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                              title="View full application profile"
                            >
                              <Eye className="w-3.5 h-3.5" />View
                            </button>

                            {(u.role === 'teacher' || u.role === 'student') && u.isApproved === false && (
                              <button onClick={() => setConfirmAction({ type: "approveUser", id: u._id, label: u.name })}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 shadow-sm rounded-lg transition-colors active:scale-95">
                                <UserCheck className="w-3.5 h-3.5" />Approve
                              </button>
                            )}
                            {u.isActive && u.isApproved !== false && (
                              <button onClick={() => setConfirmAction({ type: "deactivate", id: u._id, label: u.name })}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                                <UserX className="w-3.5 h-3.5" />Deactivate
                              </button>
                            )}
                            {!u.isActive && u.isApproved !== false && (
                              <button onClick={() => setConfirmAction({ type: "activate", id: u._id, label: u.name })}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                                <UserCheck className="w-3.5 h-3.5" />Activate
                              </button>
                            )}
                            <button onClick={() => setConfirmAction({ type: "deleteUser", id: u._id, label: u.name })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />{u.isApproved === false ? "Reject" : "Delete"}
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
        </div>
      )}

      {/* ── TAB 3: COURSES ── */}
      {activeTab === "courses" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
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
                            ? "bg-green-50 text-green-800 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {c.status || "draft"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/lms/courses/${c._id}`}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-800 text-xs font-bold rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3 text-green-600" />Valid
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

      {/* ── APPLICANT PROFILE DETAILS MODAL ── */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 relative animate-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-800 font-extrabold text-lg shadow-sm">
                {selectedApplicant.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedApplicant.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    selectedApplicant.isApproved === false
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-green-50 text-green-800 border-green-200"
                  }`}>
                    {selectedApplicant.isApproved === false ? "Pending Approval" : "Approved & Active"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium capitalize">{selectedApplicant.role || "Student"}</span>
                </div>
              </div>
            </div>

            {/* Application Data Grid */}
            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" /> Email Address
                  </p>
                  <p className="font-semibold text-slate-800 text-xs mt-1 truncate">{selectedApplicant.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3 text-green-600" /> WhatsApp Number
                  </p>
                  <p className="font-bold text-green-800 text-xs mt-1">
                    {selectedApplicant.whatsappNumber || selectedApplicant.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> District
                  </p>
                  <p className="font-semibold text-slate-800 text-xs mt-1">{selectedApplicant.district || "N/A"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-slate-500" /> Degree / Qualification
                  </p>
                  <p className="font-semibold text-slate-800 text-xs mt-1 truncate">{selectedApplicant.degreeQualification || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-500" /> Work Experience
                  </p>
                  <p className="font-semibold text-slate-800 text-xs mt-1">{selectedApplicant.workExperience || "No Experience"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Job Title</p>
                  <p className="font-semibold text-slate-800 text-xs mt-1">{selectedApplicant.currentJobTitle || "N/A"}</p>
                </div>
              </div>

              {/* Target Program Track Dropdown */}
              <div className="p-3.5 bg-green-50/80 rounded-xl border border-green-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-green-900 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-green-700" /> Target Program Track *
                  </label>
                  {selectedApplicant.requestedProgramId?.name && (
                    <span className="text-[10px] font-bold text-green-800 bg-white px-2 py-0.5 rounded border border-green-200">
                      Requested: {selectedApplicant.requestedProgramId.name}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={assignedProgramId}
                    onChange={(e) => setAssignedProgramId(e.target.value)}
                    className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
                  >
                    <option value="">-- Choose Program Track to Grant Access --</option>
                    {programs.map((p: any) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.code ? `(${p.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-green-700 font-medium">
                  Approving will automatically enroll this student in all courses & majors under this program track.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-5 border-t border-slate-100 mt-5">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
              {selectedApplicant.isApproved === false && (
                <button
                  onClick={() => {
                    const applicant = selectedApplicant;
                    const finalProgId = assignedProgramId || applicant.requestedProgramId?._id || applicant.requestedProgramId || applicant.programId?._id || applicant.programId;
                    setSelectedApplicant(null);
                    setConfirmAction({
                      type: "approveUser",
                      id: applicant._id,
                      label: applicant.name,
                      programId: finalProgId
                    });
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded-xl shadow-md shadow-green-700/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve & Enroll
                </button>
              )}
            </div>
          </div>
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
                  confirmAction.type === "approveUser" || confirmAction.type === "activate" ? "bg-green-700 hover:bg-green-800" : "bg-red-600 hover:bg-red-700"
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