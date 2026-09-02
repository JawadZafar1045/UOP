"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import { UserPlus, Mail, Lock, User, ArrowRight, CheckCircle2, Building2, Clock, ShieldCheck, X } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("cszone");
  const [role, setRole] = useState("student");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", { name, email, password, tenantId, role });
      setShowSuccessModal(true);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-green-800" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg text-white text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
            <UserPlus className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Join your college platform</h2>
          <p className="text-xl text-green-100/90 leading-relaxed mb-12">
            Access your learning materials, courses, and progress — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            {[
              { title: "Live Sessions", desc: "Join real-time classes" },
              { title: "Assignments", desc: "Submit & track work" },
              { title: "Quizzes", desc: "Test your knowledge" },
              { title: "Certificates", desc: "Earn on completion" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-200" />
                  <span className="font-bold text-white text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-green-200/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-12">
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="mb-6">
              <div className="flex justify-center">
                <img src="/agree-logo.jpg" alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>

          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-bold text-red-500">!</div>
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                  placeholder="John Doe" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                  placeholder="john@soa.edu" />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">I am a</label>
              <div className="relative group">
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none appearance-none cursor-pointer">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                  placeholder="Min 8 characters" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none group">
              {loading ? <><Loader size="sm" /> Creating Account...</> : (
                <><span>Create Account</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 font-bold hover:text-green-700 transition-colors hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </div>

      {/* Registration Request Sent Popup Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Banner */}
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-inner">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Request Sent to Admin!
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your registration request for <span className="font-bold text-slate-900">{email}</span> has been submitted to the college admin panel for review.
            </p>

            {/* Highlighted Notice */}
            <div className="mt-5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-left flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800">
                <span className="font-bold block mb-0.5">Please wait a few minutes</span>
                The institution administrator will accept your request shortly. Once accepted, you can log in directly.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 py-3 px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="py-3 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors"
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
