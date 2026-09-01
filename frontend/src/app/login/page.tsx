"use client";

import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("iub");
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
      {/* Left Side - Soft Light Mint Background (#EDF7E7) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#EDF7E7] relative overflow-hidden items-center justify-center p-12 border-r border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg text-[#2A6B25] text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-[#2A6B25]">
            Join your college platform
          </h2>
          <p className="text-xl text-[#2A6B25]/85 leading-relaxed mb-12">
            Access your learning materials, courses, and progress — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            {[
              { title: "Live Sessions", desc: "Join real-time classes" },
              { title: "Assignments", desc: "Submit & track work" },
              { title: "Quizzes", desc: "Test your knowledge" },
              { title: "Certificates", desc: "Earn on completion" }
            ].map((item, i) => (
              <div key={i} className="bg-white/80 border border-[#2A6B25]/15 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#2A6B25]" />
                  <span className="font-bold text-[#2A6B25] text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-[#2A6B25]/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="mb-8">
              <div className="flex justify-center">
                <img src="/acrotyx-logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">
              Enter your details to access your workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              error.toLowerCase().includes("pending admin approval") || error.toLowerCase().includes("pending approval") ? (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm text-slate-800 flex gap-3 items-start shadow-sm">
                  <Clock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-800 mb-0.5">Registration Pending Approval</span>
                    <p className="text-xs text-slate-700 leading-relaxed">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-600 flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    !
                  </div>
                  {error}
                </div>
              )
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                College Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2A6B25] transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-[#2A6B25]/15 focus:border-[#2A6B25] transition-all outline-none"
                  placeholder="e.g. iub"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2A6B25] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-[#2A6B25]/15 focus:border-[#2A6B25] transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2A6B25] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-[#2A6B25]/15 focus:border-[#2A6B25] transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-[#2A6B25] text-white rounded-xl font-bold hover:bg-[#21541D] transition-all shadow-lg shadow-[#2A6B25]/20 disabled:opacity-50 disabled:shadow-none group"
            >
              {loading ? (
                <><Loader size="sm" /> Signing in...</>
              ) : (
                <>
                  Sign in to LMS ACROTYX{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-slate-500 mt-8 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-[#2A6B25] font-bold hover:text-[#21541D] transition-colors"
              >
                Create new account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}