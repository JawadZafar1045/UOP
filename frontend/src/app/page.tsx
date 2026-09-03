'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import {
  Building2,
  Users,
  GraduationCap,
  FileText,
  MessageSquare,
  ArrowRight,
  Mail,
  X,
  Phone,
  Send,
  Menu,
  BookOpen,
  Target,
  BarChart3,
  Briefcase,
  Trophy,
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const [publicPrograms, setPublicPrograms] = useState<any[]>([]);
  const [isProgramsLoading, setIsProgramsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicPrograms = async () => {
      setIsProgramsLoading(true);
      try {
        const res: any = await api.get('/lms/programs/public');
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.data?.data);
        if (Array.isArray(data)) {
          setPublicPrograms(data);
        } else {
          setPublicPrograms([]);
        }
      } catch (e) {
        setPublicPrograms([]);
      } finally {
        setIsProgramsLoading(false);
      }
    };
    fetchPublicPrograms();
  }, []);

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    subject: '',
    message: '',
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoSubject = encodeURIComponent(contactForm.subject || 'LMS ACROTYX Contact Inquiry');
    const mailtoBody = encodeURIComponent(
      `Name: ${contactForm.name}\n` +
      `Email: ${contactForm.email}\n` +
      `Phone: ${contactForm.phone || 'N/A'}\n` +
      `Institution: ${contactForm.institution || 'N/A'}\n\n` +
      `Message:\n${contactForm.message}`
    );
    window.location.href = `mailto:info@cszone.pk?subject=${mailtoSubject}&body=${mailtoBody}`;
    setContactSubmitted(true);
    setContactForm({
      name: '',
      email: '',
      phone: '',
      institution: '',
      subject: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="relative pointer-events-auto flex items-center justify-between px-4 sm:px-6 py-2 w-full max-w-4xl bg-white border border-slate-200 rounded-full shadow-md transition-all duration-300 ring-1 ring-black/5">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center cursor-pointer bg-transparent border-0 p-0 outline-none hover:opacity-85 transition-opacity shrink-0"
            aria-label="Scroll to top"
          >
            <Image 
              src="/SOA_logo.jpeg"
              alt="School of Agriculture" 
              width={48}
              height={48}
              className="h-12 w-auto object-contain rounded-full"
            />
          </button>
          
          {/* Desktop/Tablet Links */}
          <div className="hidden md:flex items-center gap-3 lg:gap-5 shrink-0">
            <Link href="#about" className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-wider whitespace-nowrap">
              About
            </Link>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <Link href="#courses" className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-wider whitespace-nowrap">
              Programs
            </Link>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <Link href="#mentorship" className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-wider whitespace-nowrap">
              Mentorship
            </Link>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <button onClick={() => setIsContactOpen(true)} className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-wider whitespace-nowrap bg-transparent border-0 p-0 cursor-pointer outline-none">
              Contact
            </button>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-wider whitespace-nowrap">
              Login
            </Link>
            <Link href="/signup" className="text-xs font-bold bg-green-700 text-white px-5 py-2.5 rounded-full hover:bg-green-800 transition-all shadow-md hover:scale-105 active:scale-95 uppercase tracking-wider whitespace-nowrap shrink-0">
              Join with us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 -mr-2 text-slate-700 bg-transparent border-0 outline-none cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-52 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col gap-3 md:hidden z-50">
              <Link href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-600 hover:text-green-700 transition-colors">
                About
              </Link>
              <Link href="#courses" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-600 hover:text-green-700 transition-colors">
                Programs
              </Link>
              <Link href="#mentorship" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-600 hover:text-green-700 transition-colors">
                Mentorship
              </Link>
              <button onClick={() => { setIsContactOpen(true); setIsMobileMenuOpen(false); }} className="text-left text-sm font-bold text-slate-600 hover:text-green-700 transition-colors bg-transparent border-0 p-0 cursor-pointer outline-none">
                Contact
              </button>
              <div className="h-[1px] w-full bg-slate-100 my-1"></div>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-600 hover:text-green-700 transition-colors">
                Login
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-bold bg-green-700 text-white px-4 py-2.5 rounded-xl hover:bg-green-800 transition-all shadow-md">
                Join with us
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-green-50/50 via-white to-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 border border-green-200 text-green-800 text-xs font-bold uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              School of Agriculture LMS • Live Portal
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              School of Agriculture <br />
              <span className="bg-gradient-to-r from-green-700 via-emerald-600 to-green-800 bg-clip-text text-transparent">
                PPSC Preparation Platform
              </span>
            </h1>

            <div className="pt-2 pb-1 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-black tracking-wider shadow-xs">
                <span className="text-amber-600 font-bold">★</span>
                <span>7 YEARS OF LEGACY. 800+ SUCCESS STORIES.</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Now, a smarter way to learn, prepare &amp; succeed
              </p>
            </div>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Empowering agriculture professionals in Pakistan with target-oriented learning, course modules, practice papers, and live interactive guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-green-700/25 transition-all flex items-center justify-center gap-2 group"
              >
                Enroll Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center justify-center"
              >
                Student Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

        {/* Branding / Partners Section */}
        <section className="w-full bg-white pt-4 pb-16 border-b border-slate-200/50">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">School of Agriculture is proudly supported by</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-28">

              <div className="flex flex-col items-center gap-3 group cursor-default">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">Powered By</span>
                <img src="/cszone-logo.png" alt="CS Zone Logo" className="h-14 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-md" />
              </div>

              <div className="hidden md:block w-px h-16 bg-slate-200"></div>

              <div className="flex flex-col items-center gap-3 group cursor-default">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">Built By</span>
                <img src="/bytebuggers.png" alt="ByteBuggers Logo" className="h-12 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-md" />
              </div>

            </div>
          </div>
        </section>

        {/* Welcome to School of Agriculture & Features Section */}
        <section id="about" className="w-full bg-gradient-to-b from-green-50 via-white to-green-50/50 py-24 border-y border-green-200/80 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6 space-y-20">
            
            {/* Header / Intro */}
            <div className="text-center max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 border border-green-300/80 text-green-800 text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-green-700" />
                <span>Learn. Prepare. Get Selected.</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Welcome to <span className="text-green-800">School of Agriculture</span>
              </h2>
              <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed pt-2 text-justify sm:text-center">
                <p>
                  <strong className="text-slate-800 font-semibold">School of Agriculture (SoA)</strong> is a dedicated learning platform built to empower agriculture students, graduates, and aspiring professionals with <span className="text-green-900 font-semibold">quality education, competitive exam preparation, career guidance, and practical knowledge</span>.
                </p>
                <p>
                  For years, we have been helping agrarians turn <span className="text-green-800 font-semibold">knowledge into opportunities</span> — from PPSC and FPSC examinations to government jobs, scholarships, and professional careers.
                </p>
                <p className="font-medium text-slate-700">
                  Now, with our <span className="text-green-700 font-bold">LMS-based learning system</span>, your preparation is more organized, measurable, and accessible than ever.
                </p>
              </div>
            </div>

            {/* Officer / Mentor Cards - Reference Image 2 */}
            <div id="mentorship" className="pt-4 scroll-mt-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100/80 px-3.5 py-1 rounded-full border border-green-200">
                  Field Leadership &amp; Mentorship
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
                  Expert-Led Guidance from Officers &amp; Field Professionals
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Learn from top officers serving in the Agriculture Department Punjab.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    name: "Saad ur Rehman Saadi",
                    detail: "Agriculture Officer (Ext.) Tehsil Bahawalpur",
                    image: "/saad.jpeg",
                    badge: "Agriculture Officer"
                  },
                  {
                    name: "Zeeshan Ubaid",
                    detail: "Agriculture Officer Extension Tehsil Toba Tek Singh",
                    image: "/zeeshan_headshot.jpeg",
                    badge: "Agriculture Officer"
                  },
                  {
                    name: "Muhammad Aamir Mushtaq",
                    detail: "Director Technical, PMU Agriculture Punjab, Lahore",
                    image: "/aamir.jpeg",
                    badge: "Director Technical"
                  },
                  {
                    name: "Amin Zahid Lodhi",
                    detail: "Assistant Director Pest Warning Pakpattan",
                    image: "/amin_headshot.jpeg",
                    badge: "Assistant Director"
                  }
                ].map((officer, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14532D] via-[#166534] to-[#0f3d21] border border-green-700/40 p-5 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all group"
                  >
                    {/* Background leaf accent glow */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/90 shadow-md shrink-0 bg-white">
                      <img
                        src={officer.image}
                        alt={officer.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0 z-10">
                      <div className="inline-block mb-1.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-green-900/80 text-green-200 border border-green-600/40">
                          {officer.badge}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                        {officer.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-green-100/90 font-medium leading-snug mt-1">
                        {officer.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing Callout / Vision Box */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-900 via-green-800 to-emerald-900 text-white p-8 sm:p-12 shadow-2xl text-center">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                <p className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-green-100">
                  &ldquo;Your agriculture degree is the beginning.<br />
                  <span className="text-white font-black underline decoration-amber-400 underline-offset-4">Let School of Agriculture help you turn it into a career.&rdquo;</span>
                </p>
                <div className="pt-2">
                  <p className="text-sm sm:text-base font-bold text-amber-300 uppercase tracking-widest">
                    ★ Welcome to a smarter way of preparing. ★
                  </p>
                  <p className="text-xs sm:text-sm text-green-200/80 italic mt-1 font-medium">
                    School of Agriculture — Where Agrarians Prepare to Lead
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-green-900 font-bold rounded-xl shadow-md hover:bg-green-50 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    Start Your Preparation <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-8 py-3.5 bg-green-950/60 hover:bg-green-950/80 text-white font-bold rounded-xl border border-green-600/40 transition-all text-sm flex items-center justify-center"
                  >
                    Access Student LMS
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-24 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4 tracking-tight">How School of Agriculture Works</h2>
            <p className="text-lg text-green-700">Start your agricultural career and exam journey in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign Up", desc: "Create your student account in minutes to access the LMS portal." },
              { step: "02", title: "Explore Programs", desc: "Browse specialized PPSC & competitive exam preparation tracks." },
              { step: "03", title: "Learn & Practice", desc: "Access lectures, practice topic-wise MCQs, and track attendance." },
              { step: "04", title: "Get Certified", desc: "Clear competitive examinations and earn verified credentials." }
            ].map((step, i) => (
              <div
                key={i}
                className="p-8 flex flex-col gap-6 group bg-white border border-green-200 rounded-3xl hover:border-green-400 hover:shadow-lg transition-all duration-500 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="text-6xl font-black text-green-100 group-hover:text-green-200 transition-colors duration-500 select-none">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-green-900 mb-3 group-hover:text-green-700 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-green-700 leading-relaxed text-base">
                    {step.desc}
                  </p>
                </div>

                {/* Subtle bottom indicator */}
                <div className="absolute bottom-0 left-0 h-1.5 bg-green-700 transition-all duration-500 rounded-full w-0 group-hover:w-[40%] group-hover:left-8"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Programs / PPSC Preparation Courses Section */}
        <section id="courses" className="w-full bg-white py-24 border-t border-slate-200 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4 tracking-tight">Explore PPSC Preparation Programs</h2>
              <p className="text-lg text-green-700">Specialized agricultural competitive exam tracks designed for high success rates</p>
            </div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {isProgramsLoading ? (
                <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                  Loading programs...
                </div>
              ) : publicPrograms.length > 0 ? (
                publicPrograms.map((program: any, i: number) => (
                  <div key={program._id || i} className="bg-white rounded-2xl border border-green-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                    {/* Thumbnail / Header Banner */}
                    {program.thumbnail ? (
                      <div className="w-full h-52 relative overflow-hidden bg-slate-100 group">
                        <img
                          src={program.thumbnail}
                          alt={program.name || "Program thumbnail"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-3 py-1 bg-green-800/85 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-sm">
                            {program.degreeLevel || "PPSC Track"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-green-700 to-green-900 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-8xl font-black select-none">🌾</div>
                        <span className="inline-block self-start px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30 z-10">
                          {program.degreeLevel || "PPSC Track"}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-snug drop-shadow-sm z-10">{program.name || program.title}</h3>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex flex-col gap-3 flex-grow">
                      {program.thumbnail && (
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {program.name || program.title}
                        </h3>
                      )}
                      <p className="text-sm text-slate-600 leading-relaxed flex-grow">
                        {program.description || program.desc || "Target-oriented competitive examination preparation track with comprehensive syllabus coverage, video lectures, and notes."}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
                        <span>Program Code</span>
                        <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded-md">{program.code || "PPSC Prep"}</span>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="px-6 pb-6">
                      <Link 
                        href={program._id ? `/signup?programId=${program._id}` : "/signup"} 
                        className="block w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm transition-all text-center shadow-md hover:shadow-lg active:scale-[0.98]"
                      >
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-slate-50 border border-dashed border-green-200 rounded-3xl p-8 max-w-lg mx-auto flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Programs Currently Listed</h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Programs added in the Admin Panel will appear here automatically with their custom thumbnails and details.
                  </p>
                  <Link
                    href="/login"
                    className="mt-5 text-xs font-bold text-green-700 bg-white border border-green-300 px-5 py-2.5 rounded-full hover:bg-green-50 shadow-xs transition-all"
                  >
                    Go to Admin Portal
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-green-50 py-24 px-6 border-y border-green-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-green-900 mb-6 tracking-tight">Start Your Agricultural Career Today</h2>
            <p className="text-xl text-green-700 mb-10 max-w-2xl mx-auto">Join agrarians across Pakistan preparing for competitive success with School of Agriculture.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-green-700 text-white rounded-xl font-medium text-lg hover:bg-green-800 transition-all shadow-md flex items-center justify-center gap-2">
                Create Student Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 border border-green-200 rounded-xl font-medium text-lg hover:bg-green-50 transition-all shadow-sm flex items-center justify-center">
                Sign In to LMS
              </Link>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer className="w-full bg-white text-slate-600 py-20 px-6 relative overflow-hidden border-t border-green-100">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600/5 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-600/5 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 mb-8 group cursor-pointer bg-transparent border-0 p-0 outline-none hover:opacity-85 transition-opacity"
                aria-label="Scroll to top"
              >
                <Image 
                  src="/SOA_logo.jpeg" 
                  alt="School of Agriculture Logo" 
                  width={56}
                  height={56}
                  className="h-14 w-auto object-contain rounded-full"
                />
              </button>
              <p className="text-slate-500 mb-8 leading-relaxed max-w-sm text-sm">
                School of Agriculture (SoA).<br /> Pakistan's dedicated preparation portal for agriculture graduates, PPSC exams, and professional career pathways.
              </p>
            </div>

            {/* Product Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Navigation</h4>
              <ul className="space-y-4">
                <li><Link href="#about" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">About</Link></li>
                <li><Link href="#courses" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Programs</Link></li>
                <li><Link href="#mentorship" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Mentorship</Link></li>
                <li><Link href="#how-it-works" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">How It Works</Link></li>
                <li><Link href="/login" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Login</Link></li>
                <li><Link href="/signup" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Sign Up</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">About Us</a></li>
                <li><button onClick={() => setIsContactOpen(true)} className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block text-left bg-transparent border-0 p-0 cursor-pointer outline-none">Contact</button></li>
                <li><a href="#" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Stay Updated</h4>
              <p className="text-slate-500 mb-6 text-sm">Get the latest product updates and insights delivered to your inbox.</p>
              <form className="relative group/form" onSubmit={(e) => e.preventDefault()}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within/form:text-green-600 transition-colors" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 pl-12 pr-32 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 focus:bg-white transition-all shadow-inner"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-green-700 hover:bg-green-800 text-white px-6 rounded-lg font-semibold text-sm transition-all flex items-center justify-center shadow-md active:scale-95">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} School of Agriculture (SoA). All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
              <a href="#" className="hover:text-green-700 transition-colors">Twitter</a>
              <a href="#" className="hover:text-green-700 transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-green-700 transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-green-700 px-6 py-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg md:text-xl">Contact School of Agriculture</h3>
                <p className="text-green-100 text-xs mt-0.5">Get in touch with our team for admissions and LMS support</p>
              </div>
              <button
                onClick={() => {
                  setIsContactOpen(false);
                  setContactSubmitted(false);
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Form */}
            {!contactSubmitted ? (
              <form onSubmit={handleContactSubmit} className="p-6 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-slate-800"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-slate-800"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-slate-800"
                      placeholder="+92 300 1234567"
                    />
                  </div>

                  {/* Institution */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Institution / College</label>
                    <input
                      type="text"
                      value={contactForm.institution}
                      onChange={e => setContactForm(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-slate-800"
                      placeholder="College Name"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={e => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-slate-800"
                    placeholder="How can we help you?"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all resize-none text-slate-800"
                    placeholder="Write details of your query..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 text-lg">Thank You!</h4>
                <p className="text-slate-600 text-sm max-w-sm mx-auto">
                  Your query has been received. Our team will get back to you shortly at the email address provided.
                </p>
                <button
                  onClick={() => {
                    setIsContactOpen(false);
                    setContactSubmitted(false);
                  }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}