"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { Shield, User, Mail, Lock, Building2, Key, ArrowRight, CheckCircle2 } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function AdminRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    tenantId: "", secretKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: field === "tenantId" ? e.target.value.toLowerCase() : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register/admin", {
        name: form.name,
        email: form.email,
        password: form.password,
        tenantId: form.tenantId,
        secretKey: form.secretKey,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-800" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg text-white text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Institution Registration</h2>
          <p className="text-xl text-blue-100/90 leading-relaxed mb-12">
            Create your college admin account to set up and manage your institution on CS ZONE LMS Space.
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            {[
              { title: "Manage Users", desc: "Teachers & Students" },
              { title: "Courses", desc: "Oversee curriculum" },
              { title: "Analytics", desc: "Track performance" },
              { title: "Certificates", desc: "Issue credentials" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-300" />
                  <span className="font-bold text-white text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-blue-200/70">{item.desc}</p>
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
                <img src="/Logo-WithOut-BG.png" alt="CS ZONE LMS Logo" className="h-24 w-auto object-contain drop-shadow-md" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Institution Registration</h1>
            <p className="text-slate-500 mt-2">Create your college admin account</p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-emerald-700 font-bold text-lg">Admin account created!</p>
              <p className="text-emerald-600/80 text-sm mt-1">Redirecting to login in 2 seconds...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input type="text" required value={form.name} onChange={set("name")}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="Dr. Jane Smith" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input type="email" required value={form.email} onChange={set("email")}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="admin@college.edu" />
                </div>
              </div>

              {/* College Code */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">College Code</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input type="text" required value={form.tenantId} onChange={set("tenantId")}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. ncbae" />
                </div>
                <p className="text-xs text-slate-400 ml-1">This code will be used by all your teachers and students to register</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input type="password" required minLength={8} value={form.password} onChange={set("password")}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder="Min 8 chars" />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input type="password" required value={form.confirmPassword} onChange={set("confirmPassword")}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder="Repeat" />
                  </div>
                </div>
              </div>

              {/* Secret Key */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Admin Secret Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Key className="w-5 h-5" />
                  </div>
                  <input type="password" required value={form.secretKey} onChange={set("secretKey")}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••••••" />
                </div>
                <p className="text-xs text-slate-400 ml-1">Provided by the platform administrator</p>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none group">
                  {loading ? <><Loader size="sm" /> Registering...</> : (
                    <><span>Register Institution</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-slate-500 font-medium">
              Already registered?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
