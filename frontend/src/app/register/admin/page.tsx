"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { Shield, User, Mail, Lock, Building2, Key, ArrowRight, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 font-sans">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600/30 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/30">
              <Shield className="w-8 h-8 text-indigo-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Institution Registration</h1>
            <p className="text-slate-400 mt-1.5 text-sm text-center">Create your college admin account to get started</p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-300 font-bold text-lg">Admin account created!</p>
              <p className="text-slate-400 text-sm mt-1">Redirecting to login in 2 seconds...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm text-red-300 flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5 font-bold text-red-400">!</div>
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <Field icon={<User className="w-4 h-4" />} label="Full Name">
                <input type="text" required value={form.name} onChange={set("name")}
                  className="input-dark" placeholder="Dr. Jane Smith" />
              </Field>

              {/* Email */}
              <Field icon={<Mail className="w-4 h-4" />} label="Email Address">
                <input type="email" required value={form.email} onChange={set("email")}
                  className="input-dark" placeholder="admin@college.edu" />
              </Field>

              {/* College Code */}
              <Field icon={<Building2 className="w-4 h-4" />} label="College Code" helper="This code will be used by all your teachers and students to register">
                <input type="text" required value={form.tenantId} onChange={set("tenantId")}
                  className="input-dark" placeholder="e.g. ncbae" />
              </Field>

              {/* Password */}
              <Field icon={<Lock className="w-4 h-4" />} label="Password">
                <input type="password" required minLength={8} value={form.password} onChange={set("password")}
                  className="input-dark" placeholder="Min 8 characters" />
              </Field>

              {/* Confirm Password */}
              <Field icon={<Lock className="w-4 h-4" />} label="Confirm Password">
                <input type="password" required value={form.confirmPassword} onChange={set("confirmPassword")}
                  className="input-dark" placeholder="Repeat password" />
              </Field>

              {/* Secret Key */}
              <Field icon={<Key className="w-4 h-4" />} label="Admin Secret Key" helper="Provided by the platform administrator">
                <input type="password" required value={form.secretKey} onChange={set("secretKey")}
                  className="input-dark" placeholder="••••••••••••" />
              </Field>

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 group">
                  {loading ? "Registering..." : (
                    <><span>Register Institution</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already registered?{" "}
              <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input-dark {
          display: block;
          width: 100%;
          padding: 0.625rem 0.875rem 0.625rem 2.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          color: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
        }
        .input-dark::placeholder { color: #475569; }
        .input-dark:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
      `}</style>
    </div>
  );
}

function Field({ icon, label, helper, children }: {
  icon: React.ReactNode; label: string; helper?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          {icon}
        </div>
        {children}
      </div>
      {helper && <p className="text-xs text-slate-500 ml-1">{helper}</p>}
    </div>
  );
}
