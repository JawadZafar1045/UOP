"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res: any = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      if (res.data?.debugOtp) {
        setOtp(res.data.debugOtp);
        setInfoMessage(
          (res.data?.message || "Verification code dispatched.") +
          ` [Dev Code: ${res.data.debugOtp}]`
        );
      } else {
        setInfoMessage(res.data?.message || "Verification code sent to your email. (Please check Spam/Junk folder if not in Inbox)");
      }
      setStep(2);
      setResendCooldown(60);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");

    try {
      const res: any = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      if (res.data?.debugOtp) {
        setOtp(res.data.debugOtp);
        setInfoMessage("New verification code dispatched. [Dev Code: " + res.data.debugOtp + "]");
      } else {
        setInfoMessage(res.data?.message || "A new verification code was sent. (Check Spam/Junk if needed)");
      }
      setResendCooldown(60);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Failed to resend code. Please try again in a few moments."
      );
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        "Failed to reset password. Please check your OTP and try again."
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
            <KeyRound className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Account Recovery</h2>
          <p className="text-xl text-green-100/90 leading-relaxed mb-12">
            Securely recover access to your learning portal and continue your academic journey.
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            {[
              { title: "One-Time Password", desc: "Sent straight to your email" },
              { title: "Instant Reset", desc: "Update your password immediately" },
              { title: "Account Protection", desc: "Time-limited secure OTP" },
              { title: "Encrypted Data", desc: "Bank-grade credentials security" },
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

      {/* Right Side - Recovery Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-12">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="mb-6">
              <div className="flex justify-center">
                <img src="/agree-logo.jpg" alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
              </div>
            </Link>

            {step !== 3 && (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-800 rounded-full text-xs font-bold mb-3 border border-green-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Step {step} of 2</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 text-center">
                  {step === 1 ? "Forgot Password" : "Reset Password"}
                </h1>
                <p className="text-slate-500 mt-2 text-center text-sm">
                  {step === 1
                    ? "Enter your registered email address and we'll send you a 6-digit OTP code."
                    : `Enter the 6-digit code sent to ${email} and set your new password.`}
                </p>
              </>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 flex gap-3 items-start animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {infoMessage && step === 2 && !error && (
            <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl text-sm text-green-800 flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Registered Email Address</label>
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
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none group mt-2"
              >
                {loading ? (
                  <><Loader size="sm" /> Sending OTP...</>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-green-700 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Code sent to <strong className="text-slate-800">{email}</strong></span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="text-green-700 font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* OTP Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">6-Digit Verification Code (OTP)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 tracking-widest font-mono text-lg font-bold placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                    placeholder="123456"
                    autoFocus
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 ml-1">Must be at least 6 characters long.</p>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Confirm New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-600 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Resend OTP Button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || resending}
                  onClick={handleResendOtp}
                  className="font-bold text-green-700 hover:text-green-800 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none group mt-2"
              >
                {loading ? (
                  <><Loader size="sm" /> Resetting Password...</>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-green-700 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Password Reset Complete!</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your password has been securely updated. You can now log into your SOA LMS account using your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 group"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Footer Assistance */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Need assistance? Contact support at{" "}
              <a href="mailto:developmentteam@zarat.pk" className="text-green-700 font-semibold hover:underline">
                developmentteam@zarat.pk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
