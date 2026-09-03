"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import api from "@/services/api";
import { 
  UserPlus, Mail, Lock, User, ArrowRight, CheckCircle2, 
  Building2, Clock, ShieldCheck, X, Phone, MapPin, 
  GraduationCap, Briefcase, BookOpen
} from "lucide-react";
import Loader from "@/components/ui/Loader";

const WORK_EXPERIENCE_OPTIONS = [
  "No Experience",
  "Less than 1 Year",
  "1–3 Years",
  "3–5 Years",
  "More than 5 Years"
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProgramId = searchParams.get("programId") || "";

  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [degreeQualification, setDegreeQualification] = useState("");
  const [workExperience, setWorkExperience] = useState("No Experience");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [programId, setProgramId] = useState(initialProgramId || "");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("cszone");

  const [programs, setPrograms] = useState<any[]>([]);
  const [isProgramsLoading, setIsProgramsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch only programs that actually exist in the database
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsProgramsLoading(true);
      try {
        let list: any[] = [];
        try {
          const res: any = await api.get("/auth/programs");
          const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.data?.data);
          if (Array.isArray(data) && data.length > 0) {
            list = data;
          }
        } catch {
          // Fallback to lms public endpoint
          try {
            const res2: any = await api.get("/lms/programs/public");
            const data2 = Array.isArray(res2?.data) ? res2.data : (Array.isArray(res2) ? res2 : res2?.data?.data);
            if (Array.isArray(data2) && data2.length > 0) {
              list = data2;
            }
          } catch {}
        }

        setPrograms(list);
        if (list.length > 0) {
          if (initialProgramId) {
            const matched = list.find((p: any) => p._id === initialProgramId || p.code === initialProgramId);
            if (matched) {
              setProgramId(matched._id);
            }
          }
        }
      } catch (e) {
        setPrograms([]);
      } finally {
        setIsProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, [initialProgramId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      setError("Please select the Program / Degree Track you are applying for.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        name,
        whatsappNumber,
        phone: whatsappNumber,
        email,
        district,
        degreeQualification,
        workExperience,
        currentJobTitle: currentJobTitle.trim() || "N/A",
        programId: programId,
        password,
        tenantId,
        role: "student"
      });
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
      {/* Left Side Feature Banner */}
      <div className="hidden lg:flex lg:w-5/12 bg-green-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14532D] via-[#166534] to-[#14532D]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-white text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight leading-snug">
            School of Agriculture
          </h2>
          <p className="text-base text-green-100/90 leading-relaxed mb-8">
            PPSC Competitive Exam & Agriculture Specialization Portal. Complete your admission form to request student enrollment.
          </p>

          {/* Feature Badges */}
          <div className="space-y-3 text-left">
            {[
              { title: "Program Specific Learning", desc: "Targeted modules for BS-17 & BS-18 competitive exams" },
              { title: "Core & Major Subjects", desc: "Structured syllabus with live video sessions and handouts" },
              { title: "Mock Tests & Quizzes", desc: "Timed evaluations with instant performance feedback" },
              { title: "Verified Credentials", desc: "Admin verified enrollment & academic transcript tracking" }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" />
                  <span className="font-bold text-white text-xs">{item.title}</span>
                </div>
                <p className="text-[11px] text-green-100/80 pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-4 sm:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-xl py-8">
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="mb-4 hover:opacity-90 transition-opacity">
              <img src="/agree-logo.jpg" alt="Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Admission & Registration
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 max-w-md">
              Fill in your details below and select your target program track to apply.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 flex gap-3 items-start animate-shake">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-bold text-red-500">!</div>
                <span>{error}</span>
              </div>
            )}

            {/* Program Track (Essential Field with Dropdown) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-green-700" />
                Select Program Track *
              </label>
              <div className="relative group">
                <select
                  required
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="block w-full px-4 py-3 bg-green-50/60 border-2 border-green-200 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">
                    {isProgramsLoading
                      ? "-- Loading available programs... --"
                      : programs.length === 0
                      ? "-- No programs available --"
                      : "-- Choose Program Track (Required) --"}
                  </option>
                  {programs.map((prog) => (
                    <option key={prog._id} value={prog._id}>
                      {prog.name} {prog.code ? `(${prog.code})` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-green-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Row 1: Full Name & WhatsApp Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Full Name *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                    placeholder="e.g. Muhammad Ali"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  WhatsApp Number *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                    placeholder="e.g. 03001234567"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email Address & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Email Address *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                    placeholder="e.g. ali@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  District *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                    placeholder="e.g. Faisalabad / Multan / Lahore"
                  />
                </div>
              </div>
            </div>

            {/* Degree / Qualification */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                Degree / Qualification *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={degreeQualification}
                  onChange={(e) => setDegreeQualification(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                  placeholder="e.g. B.Sc (Hons) Agriculture / M.Sc Entomology"
                />
              </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                Work Experience *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <select
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  className="block w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                >
                  {WORK_EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Current Job Title (if employed) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Current Job Title (if employed)
                </label>
                <span className="text-[11px] text-slate-400">Write "N/A" if not employed</span>
              </div>
              <input
                type="text"
                value={currentJobTitle}
                onChange={(e) => setCurrentJobTitle(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                placeholder='e.g. Field Officer / Agronomist or "N/A"'
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                Account Password *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-700 transition-colors">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-600 focus:bg-white transition-all outline-none"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 transition-all shadow-md shadow-green-700/20 active:scale-[0.98] disabled:opacity-50 group"
              >
                {loading ? (
                  <><Loader size="sm" /> Submitting Application...</>
                ) : (
                  <>
                    <span>Submit Admission Application</span>
                    <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-slate-500 font-medium">
              Already enrolled?{" "}
              <Link href="/login" className="text-green-700 font-bold hover:text-green-800 transition-colors hover:underline">
                Sign in to Student Portal
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
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/login");
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Banner */}
            <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-center text-green-700 mx-auto mb-5 shadow-inner">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Application Submitted!
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your registration application for <span className="font-bold text-slate-900">{name}</span> (<span className="font-semibold text-slate-700">{email}</span>) has been received.
            </p>

            {/* Highlighted Notice */}
            <div className="mt-5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-left flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Admin Approval in Progress</p>
                <p>
                  The college administration will review your academic qualifications and grant you access to your selected program track.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold shadow-md shadow-green-700/20 transition-all active:scale-[0.98]"
              >
                Go to Student Login
              </button>
              <Link
                href="/"
                className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader size="lg" text="Loading form..." /></div>}>
      <SignupForm />
    </Suspense>
  );
}
