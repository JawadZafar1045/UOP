"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { useStore } from "@/store/useStore";
import { Mail, Lock, User, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import Loader from "@/components/ui/Loader";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/lms";
  const setAuth = useStore((state) => state.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const loginRes: any = await api.post("/auth/login", {
        email,
        password,
      });
      const { accessToken, refreshToken, user } = loginRes.data;

      setAuth(user, accessToken, refreshToken);
      router.push(returnUrl);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed. Please check your details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Left Side - Bright Executive Marketing Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50/90 via-white to-slate-100 relative overflow-hidden items-center justify-center p-12 text-slate-900 border-r border-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-60" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/40 blur-[120px] rounded-full pointer-events-none animate-blob" />

        <div className="relative z-10 max-w-lg space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200 shadow-xs animate-fade-in-down">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            CSZone Learning Platform
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Start Learning for Free Today
          </h2>

          <p className="text-slate-600 text-base leading-relaxed">
            Create your account to unlock interactive cybersecurity modules, web engineering tracks, and hands-on projects.
          </p>

          <div className="space-y-3 pt-4">
            {[
              "Immediate enrollment in free courses",
              "Video lecture playback & progress saving",
              "Admin-reviewed admission into specialized tracks",
              "Verified certificates of completion",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
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
                src="/cszone-logo.png"
                alt="CSZone"
                className="h-12 w-auto mx-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Free Account</h1>
            <p className="text-slate-500 text-sm">Join the CSZone student community</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-600 font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Khan"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="learner@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-extrabold text-sm transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader size="sm" text="Creating account..." />
              ) : (
                <>
                  Create Account & Start Learning
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
              className="text-blue-600 font-bold hover:underline"
            >
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Loading..." /></div>}>
      <SignupForm />
    </Suspense>
  );
}
