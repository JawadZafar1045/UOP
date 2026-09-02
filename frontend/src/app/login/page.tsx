"use client";

import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, Clock, LogIn } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("cszone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res: any = await api.post("/auth/login", {
        email,
        password,
        tenantId,
      });
      const { accessToken, refreshToken, user } = res.data;

      setAuth(user, accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Left Side - Deep Green Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-green-800" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg text-white text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
            <LogIn className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Welcome Back to SOA</h2>
          <p className="text-xl text-green-100/90 leading-relaxed mb-12">
            Access your learning materials, courses, and academic portal — all in one place.
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-12">
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="mb-6">
              <div className="flex justify-center">
                <img src="/agree-logo.jpg" alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Enter your credentials to access your portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              error.toLowerCase().includes("pending admin approval") || error.toLowerCase().includes("pending approval") ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-900 flex gap-3 items-start shadow-sm">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-900 mb-0.5">Account Pending Approval</span>
                    <p className="text-xs text-amber-800 leading-relaxed">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-bold text-red-500">
                    !
                  </div>
                  <span>{error}</span>
                </div>
              )
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                  placeholder="name@soa.edu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none group mt-2"
            >
              {loading ? (
                <><Loader size="sm" /> Signing in...</>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-slate-500 font-medium">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-green-600 font-bold hover:text-green-700 transition-colors hover:underline underline-offset-4"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}