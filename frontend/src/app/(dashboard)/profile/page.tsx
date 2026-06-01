"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { updateProfile, updatePassword } from "@/services/auth.service";
import {
  User,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  Phone,
  MapPin,
  Lock,
  Bell,
  Camera,
  Eye,
  EyeOff,
  AlertCircle,
  BookOpen,
  Award,
  TrendingUp,
  Flame,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "personal" | "password" | "notifications";

interface NotifPref {
  id: string;
  label: string;
  sub: string;
  enabled: boolean;
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        enabled ? "bg-indigo-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 gap-1 hover:-translate-y-0.5 transition-transform duration-200 cursor-default">
      <div className="text-indigo-500 mb-1">{icon}</div>
      <span className="text-xl font-bold text-slate-800">{value}</span>
      <span className="text-[11px] text-slate-400 font-medium tracking-wide text-center">
        {label}
      </span>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
        type === "success"
          ? "bg-slate-900 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  // Personal info state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user?.avatar || null);

  // Password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState<NotifPref[]>([
    {
      id: "announcements",
      label: "Course announcements",
      sub: "When instructors post updates",
      enabled: true,
    },
    {
      id: "reminders",
      label: "Assignment reminders",
      sub: "24h before deadlines",
      enabled: true,
    },
    {
      id: "grades",
      label: "Grade notifications",
      sub: "When assignments are graded",
      enabled: true,
    }
  ]);

  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setBio(user.bio || "");
      setAvatarSrc(user.avatar || null);
    }
  }, [user]);

  const PRESETS = [
    { name: "Student 1", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 2", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 3", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 4", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 5", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 6", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pat&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 7", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robin&eyes=default,happy&mouth=default,smile,twinkle" },
    { name: "Student 8", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey&eyes=default,happy&mouth=default,smile,twinkle" },
  ];

  // Save personal info
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check if anything has actually changed
    const hasChanges = 
      name.trim() !== user.name ||
      phone.trim() !== (user.phone || "") ||
      location.trim() !== (user.location || "") ||
      bio.trim() !== (user.bio || "") ||
      avatarSrc !== (user.avatar || null);
      
    if (!hasChanges) return;

    setIsLoading(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        bio: bio.trim(),
        avatar: avatarSrc || undefined
      });
      
      const updatedUser = res.data || res;
      updateUser(updatedUser);
      setToast({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  // Save password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setToast({ type: "error", text: "Passwords do not match." });
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword({ currentPwd, newPwd });
      setToast({ type: "success", text: "Password updated successfully!" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setIsLoading(false);
    }
  };

  // Save notifications
  const handleSaveNotifs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    setToast({ type: "success", text: "Notification preferences saved!" });
  };

  if (!user) return null;

  const initials = user.name.charAt(0).toUpperCase();
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: "Personal info", icon: <User className="w-3.5 h-3.5" /> },
    { id: "password", label: "Password", icon: <Lock className="w-3.5 h-3.5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Your profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information and account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[272px_1fr] gap-5 items-start">
        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Avatar + Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Top gradient band */}
            <div className="h-20 bg-gradient-to-br from-indigo-500 to-violet-600 relative">
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-[20px]" />
            </div>

            <div className="px-6 pb-6 -mt-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative group mb-3">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold hover:opacity-90 transition-opacity"
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </button>
                <div className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                  <Camera className="w-3 h-3 text-slate-500" />
                </div>
              </div>

              <h2 className="font-semibold text-slate-900 text-base">{user.name}</h2>
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                {user.role}
              </span>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 w-full mt-5">
                <StatCard icon={<BookOpen className="w-4 h-4" />} value={4} label="Courses" />
                <StatCard icon={<Award className="w-4 h-4" />} value={12} label="Completed" />
                <StatCard icon={<TrendingUp className="w-4 h-4" />} value="87%" label="Avg Score" />
                <StatCard icon={<Flame className="w-4 h-4" />} value={23} label="Day streak" />
              </div>

              {/* Progress */}
              <div className="w-full mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Course progress</span>
                  <span className="text-indigo-600 font-semibold">75%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-indigo-700 mb-1.5">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold">Security note</span>
            </div>
            <p className="text-xs text-indigo-600/80 leading-relaxed">
              Your email is used for authentication across all enrolled courses and cannot be changed.
            </p>
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-sm px-4 py-4 border-b-2 -mb-px font-medium transition-colors duration-150 ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Personal Info ── */}
          {activeTab === "personal" && (
            <form onSubmit={handleSavePersonal} className="p-6 space-y-5 animate-in fade-in duration-200">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Account details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Email cannot be changed for security reasons.</p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      optional
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="+92 300 0000000"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  Bio
                  <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    optional
                  </span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Tell something about yourself..."
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setPhone(user.phone || "");
                    setLocation(user.location || "");
                    setBio(user.bio || "");
                    setAvatarSrc(user.avatar || null);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (name.trim() === user.name &&
                      phone.trim() === (user.phone || "") &&
                      location.trim() === (user.location || "") &&
                      bio.trim() === (user.bio || "") &&
                      avatarSrc === (user.avatar || null))
                  }
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] shadow-sm shadow-indigo-200"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save changes
                </button>
              </div>
            </form>
          )}

          {/* ── Password ── */}
          {activeTab === "password" && (
            <form onSubmit={handleSavePassword} className="p-6 space-y-5 animate-in fade-in duration-200">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Change password
              </p>

              {/* Current */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> New password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                    confirmPwd && confirmPwd !== newPwd
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                      : "border-slate-200"
                  }`}
                  placeholder="Re-enter new password"
                  required
                />
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !currentPwd || !newPwd || newPwd !== confirmPwd}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] shadow-sm shadow-indigo-200"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Update password
                </button>
              </div>
            </form>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotifs} className="p-6 space-y-1 animate-in fade-in duration-200">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Notification preferences
              </p>
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{n.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.sub}</p>
                  </div>
                  <Toggle
                    enabled={n.enabled}
                    onChange={(v) =>
                      setNotifs((prev) =>
                        prev.map((p) => (p.id === n.id ? { ...p, enabled: v } : p))
                      )
                    }
                  />
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.97] shadow-sm shadow-indigo-200"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save preferences
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />
      )}

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Choose Profile Avatar</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Select a premium illustration preset. These lightweight avatars keep the platform fast and save database storage!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-3 py-2">
              {/* Dynamic Initials Avatar */}
              <button
                type="button"
                onClick={() => {
                  setAvatarSrc(`https://api.dicebear.com/7.x/initials/svg?seed=${name}`);
                  setShowAvatarModal(false);
                }}
                className={`aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 transition-all hover:scale-105 ${
                  avatarSrc?.includes("initials")
                    ? "ring-4 ring-indigo-500 ring-offset-2"
                    : "ring-1 ring-slate-200"
                }`}
              >
                <div className="w-full h-full bg-slate-950/10 flex flex-col items-center justify-center text-white text-xs font-bold leading-tight">
                  <span className="text-lg uppercase">{name ? name.charAt(0) : "U"}</span>
                  <span className="text-[9px] font-semibold opacity-80 uppercase mt-0.5">Initials</span>
                </div>
              </button>

              {PRESETS.map((p) => {
                const isSelected = avatarSrc === p.url;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setAvatarSrc(p.url);
                      setShowAvatarModal(false);
                    }}
                    className={`aspect-square rounded-2xl overflow-hidden bg-slate-50 border p-1 transition-all hover:scale-105 hover:bg-slate-100 ${
                      isSelected
                        ? "border-indigo-500 ring-4 ring-indigo-500 ring-offset-2"
                        : "border-slate-200"
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAvatarSrc(null);
                  setShowAvatarModal(false);
                }}
                className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl hover:bg-rose-100 transition-colors"
              >
                Remove Avatar
              </button>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-xs font-semibold text-white bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}