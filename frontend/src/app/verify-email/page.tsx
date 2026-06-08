"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/services/auth.service";
import { KeyRound, ArrowRight, ShieldCheck } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const tenantId = searchParams.get("tenantId") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !tenantId) {
      setError("Missing email or college code. Please register again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyEmail({ email, code, tenantId });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <ShieldCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
        <p className="text-slate-500">Your account is now active. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <KeyRound className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Verify your Email</h1>
        <p className="text-slate-500 mt-2 text-center">
          We sent a 6-digit verification code to <br/>
          <span className="font-semibold text-slate-700">{email || "your email"}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-bold text-red-500">!</div>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Verification Code</label>
          <input
            type="text"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // only allow numbers
            className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-center text-2xl tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-normal"
            placeholder="Enter 6-digit code"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none group"
        >
          {loading ? "Verifying..." : (
            <><span>Verify Email</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Didn't receive the code?{" "}
          <Link href="/signup" className="text-blue-600 font-bold hover:underline">
            Try registering again
          </Link>
        </p>
      </div>
    </>
  );
}

import Loader from "@/components/ui/Loader";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <Suspense fallback={<div className="py-12"><Loader text="Loading..." /></div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
