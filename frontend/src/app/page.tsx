'use client';

import Link from 'next/link';
import {
  Building2,
  Users,
  GraduationCap,
  FileText,
  MessageSquare,
  ArrowRight,
  Mail
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto flex items-center gap-6 md:gap-8 px-6 py-2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl shadow-blue-900/10 transition-all duration-300 ring-1 ring-black/5">
          <div className="flex items-center">
            <img src="/uop_logo_final.png" alt="UOP Logo" className="h-8 md:h-10 w-auto object-contain" />
          </div>
          <div className="hidden md:block h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-5 md:gap-6">
            <Link href="/login" className="text-[10px] md:text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-widest">
              Login
            </Link>
            <Link href="/signup" className="text-[10px] md:text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 uppercase tracking-widest">
              Join with us
            </Link>
          </div>
        </nav>
      </div>




      <main className="flex-grow flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full px-4 pt-4 pb-12">
          <div className="relative w-full max-w-7xl mx-auto min-h-[70vh] md:min-h-[75vh] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center justify-center shadow-2xl">

            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop" 
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-slate-900/40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20"></div>
            </div>


            {/* Hero Content */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-16 pb-10 md:pt-20 md:pb-14 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] md:text-sm font-medium mb-6 border border-white/30">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Unified Operations Platform is live
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-[1.15]">
                Manage your business, learning, and communication <span className="text-blue-400">in one place</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-100 max-w-2xl mb-10 leading-relaxed font-medium drop-shadow-sm">
                The all-in-one SaaS platform that brings your CRM, employee management, LMS, and team communication into a single, unified workspace.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base md:text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                  Start for free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="w-full sm:w-auto px-8 py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold text-base md:text-lg hover:bg-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95">
                  Login to workspace
                </Link>
              </div>
            </div>




            {/* Decorative bottom curve/overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent z-0"></div>
          </div>
        </section>



        {/* Features Section */}
        <section id="features" className="w-full bg-white py-24 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to run your business</h2>
              <p className="text-lg text-slate-600">Powerful, interconnected modules designed to eliminate silos and boost your team's productivity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Building2 className="w-6 h-6 text-blue-600" />, title: "CRM", desc: "Manage leads, track pipelines, and close more deals with our intuitive CRM." },
                { icon: <GraduationCap className="w-6 h-6 text-indigo-600" />, title: "LMS", desc: "Create courses, manage students, and track learning progress effortlessly." },
                { icon: <Users className="w-6 h-6 text-teal-600" />, title: "Employee Management", desc: "Centralize your HR operations, attendance, and employee records." },
                { icon: <FileText className="w-6 h-6 text-emerald-600" />, title: "Document Tracking", desc: "Store, share, and track all your important business documents securely." },
                { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, title: "Unified Communication", desc: "Connect your team with real-time messaging, announcements, and alerts." }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">How UOP Works</h2>
            <p className="text-lg text-slate-600">A seamless flow from lead acquisition to team operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Capture Leads", desc: "Bring in prospects through integrated CRM forms." },
              { step: "02", title: "Convert", desc: "Turn leads into active students or employees." },
              { step: "03", title: "Manage Options", desc: "Assign courses, tasks, and manage operations." },
              { step: "04", title: "Track Success", desc: "Monitor everything in one unified dashboard." }
            ].map((step, i) => (
              <div
                key={i}
                className="p-8 flex flex-col gap-6 group bg-white border border-slate-200 rounded-3xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="text-6xl font-black text-slate-200 group-hover:text-blue-100 transition-colors duration-500 select-none">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-base">
                    {step.desc}
                  </p>
                </div>

                {/* Subtle bottom indicator */}
                <div className="absolute bottom-0 left-0 h-1.5 bg-blue-600 transition-all duration-500 rounded-full w-0 group-hover:w-[40%] group-hover:left-8"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-blue-50 py-24 px-6 border-y border-blue-100">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Start using UOP today</h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">Join forward-thinking companies running their operations on UOP.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white text-slate-600 py-20 px-6 relative overflow-hidden border-t border-slate-100">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 mb-8 group cursor-default">
                <img src="/uop_logo_final.png" alt="UOP Logo" className="h-14 w-auto object-contain" />
              </div>
              <p className="text-slate-500 mb-8 leading-relaxed max-w-sm text-sm">
                Unified Operations Platform.<br /> Manage your CRM, LMS, HR, and Communication from a single source of truth.
              </p>
            </div>

            {/* Product Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Product</h4>
              <ul className="space-y-4">
                <li><Link href="#features" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Features</Link></li>
                <li><Link href="/login" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Login</Link></li>
                <li><Link href="/signup" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Sign Up</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">About Us</a></li>
                <li><a href="#" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Contact</a></li>
                <li><a href="#" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Stay Updated</h4>
              <p className="text-slate-500 mb-6 text-sm">Get the latest product updates and insights delivered to your inbox.</p>
              <form className="relative group/form" onSubmit={(e) => e.preventDefault()}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within/form:text-blue-600 transition-colors" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 pl-12 pr-32 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-semibold text-sm transition-all flex items-center justify-center shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} Unified Operations Platform. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
              <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-blue-600 transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-blue-600 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
