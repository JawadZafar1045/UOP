"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { Shield, User, Mail, Lock, Key, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function AdminRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    secretKey: "uop_admin_2026",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register/admin", {
        name: form.name,
        email: form.email,
        password: form.password,
        secretKey: form.secretKey,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex overflow-hidden font-sans">
      {/* Left Side Banner - Bright Executive Theme */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#021F37] via-[#0b4a66] to-[#0E8696] relative overflow-hidden items-center justify-center p-12 text-white border-r border-white/15">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2fc3d4]/20 blur-[120px] rounded-full pointer-events-none animate-blob" />

        <div className="relative z-10 max-w-lg space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/15 shadow-xs animate-fade-in-down">
            <Shield className="w-4 h-4 text-[#2fc3d4]" />
            School of Information Security Control Center
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Administrator Setup
          </h2>

          <p className="text-white/80 text-base leading-relaxed">
            Create an administrator account to manage curriculum, review paid student enrollments, upload lectures, and monitor platform performance.
          </p>

          <div className="space-y-3 pt-4">
            {[
              "Course & module curriculum builder",
              "Paid course registration review & approvals",
              "Video lecture uploads and streaming settings",
              "Student enrollments & user management",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/90 font-medium">
                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#2fc3d4] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up animation-delay-100">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block mb-2 group">
              <img
                src="/SIS-logo.png"
                alt="School of Information Security"
                className="h-20 sm:h-24 w-auto mx-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <h1 className="text-3xl font-black text-[#021F37] tracking-tight">Admin Registration</h1>
            <p className="text-[#4d6477] text-sm">Create an administrator account for the School of Information Security</p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-green-900 font-extrabold text-lg">Admin Account Created!</p>
              <p className="text-green-700 text-sm">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-600 font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#5f7587] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Admin Name"
                    className="w-full pl-10 pr-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider block mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5f7587] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    placeholder="admin@cszone.pk"
                    className="w-full pl-10 pr-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5f7587] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={set("password")}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider block mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5f7587] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                    />
                  </div>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider block mb-1.5">
                  Admin Setup Secret
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#5f7587] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={form.secretKey}
                    onChange={set("secretKey")}
                    placeholder="uop_admin_2026"
                    className="w-full pl-10 pr-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                  />
                </div>
                <p className="text-[11px] text-[#5f7587] mt-1 font-medium">Default secret key: <code className="text-[#0E8696] font-mono">uop_admin_2026</code></p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-[#0E8696]/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader size="sm" text="Creating Admin Account..." />
                ) : (
                  <>
                    Create Admin Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center text-xs text-[#4d6477]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0E8696] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
