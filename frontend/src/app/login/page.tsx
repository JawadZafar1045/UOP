// "use client";

// import { useStore } from "@/store/useStore";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import Link from "next/link";
// import api from "@/services/api";
// import { LogIn, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

// export default function LoginPage() {
//   const router = useRouter();
//   const setAuth = useStore((state) => state.setAuth);

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [tenantId, setTenantId] = useState("default");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const res: any = await api.post("/auth/login", { email, password, tenantId });
//       setAuth(res.data.user, res.data.accessToken);
//       router.push("/dashboard");
//     } catch (err: any) {
//       setError(err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
//       {/* Left Side - Visual/Marketing */}
//       <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
//         <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
//         <div className="absolute top-0 left-0 w-full h-full opacity-10">
//           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
//           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
//         </div>

//         <div className="relative z-10 max-w-lg text-white">
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8 border border-white/20">
//             <ShieldCheck className="w-4 h-4" />
//             Secure Enterprise Login
//           </div>
//           <h2 className="text-4xl font-bold mb-6 tracking-tight">Your entire business, Unified.</h2>
//           <p className="text-xl text-blue-100/90 leading-relaxed mb-8">
//             Access your CRM, LMS, and communication tools in one secure environment. Seamless operations start here.
//           </p>
//           <div className="space-y-4">
//             {[
//               "Unified CRM & Lead Tracking",
//               "Powerful Learning Management",
//               "Real-time Team Communication",
//               "Centralized Employee Directory"
//             ].map((text, i) => (
//               <div key={i} className="flex items-center gap-3">
//                 <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
//                   <ShieldCheck className="w-3 h-3" />
//                 </div>
//                 <span className="text-blue-50 font-medium">{text}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Right Side - Login Form */}
//       <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
//         <div className="w-full max-w-md">
//           {/* Logo & Header */}
//           <div className="flex flex-col items-center mb-10">
//             <Link href="/" className="mb-8">
//               <div className="flex items-center gap-2">
//                 <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">U</div>
//                 <span className="font-extrabold text-2xl text-slate-900 tracking-tight">UOP</span>
//               </div>
//             </Link>
//             <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
//             <p className="text-slate-500 mt-2">Enter your details to access your workspace</p>
//           </div>

//           <div className="relative mb-8">
//             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
//             <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-slate-400">
//               <span className="bg-white px-4">Or sign in with email</span>
//             </div>
//           </div>

//           <form onSubmit={handleLogin} className="space-y-5">
//             {error && (
//               <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-600 flex gap-3 items-start">
//                 <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">!</div>
//                 {error}
//               </div>
//             )}

//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-700 ml-1">Workspace Tenant ID</label>
//               <div className="relative group">
//                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
//                   <ShieldCheck className="w-5 h-5" />
//                 </div>
//                 <input
//                   type="text"
//                   required
//                   value={tenantId}
//                   onChange={(e) => setTenantId(e.target.value)}
//                   className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
//                   placeholder="e.g. default or company-name"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
//               <div className="relative group">
//                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
//                   <Mail className="w-5 h-5" />
//                 </div>
//                 <input
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
//                   placeholder="name@company.com"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between ml-1">
//                 <label className="text-sm font-semibold text-slate-700">Password</label>
//                 <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot password?</Link>
//               </div>
//               <div className="relative group">
//                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
//                   <Lock className="w-5 h-5" />
//                 </div>
//                 <input
//                   type="password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
//                   placeholder="••••••••"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center gap-2 ml-1">
//               <input
//                 id="remember"
//                 type="checkbox"
//                 className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
//               />
//               <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">Keep me signed in</label>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none group"
//             >
//               {loading ? (
//                 <>Signing in...</>
//               ) : (
//                 <>Sign in to UOP <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
//               )}
//             </button>
//           </form>

//           <div className="mt-10 text-center">
//             <p className="text-sm text-slate-500 font-medium">
//               New to the platform?{" "}
//               <Link href="/signup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors underline-offset-4 hover:underline">
//                 Create an account
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("default");
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
      {/* Left Side - Visual/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
        {/* Updated to Tailwind v4-ready gradient syntax */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8 border border-white/20">
            <ShieldCheck className="w-4 h-4" />
            Secure Enterprise Login
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Your entire business, Unified.
          </h2>
          <p className="text-xl text-blue-100/90 leading-relaxed mb-8">
            Access your CRM, LMS, and communication tools in one secure
            environment. Seamless operations start here.
          </p>
          <div className="space-y-4">
            {[
              "Unified CRM & Lead Tracking",
              "Powerful Learning Management",
              "Real-time Team Communication",
              "Centralized Employee Directory",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <span className="text-blue-50 font-medium">{text}</span>
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
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                  U
                </div>
                <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
                  UOP
                </span>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">
              Enter your details to access your workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-600 flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  !
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Workspace Tenant ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="e.g. default"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
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
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none group"
            >
              {loading ? (
                <>Signing in...</>
              ) : (
                <>
                  Sign in to UOP{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-slate-500 mt-8 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
              >
                Create a workspace
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
