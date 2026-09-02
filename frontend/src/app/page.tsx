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
  Menu
} from 'lucide-react';

export default function LandingPage() {
  const [studentCount, setStudentCount] = useState(250);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [publicPrograms, setPublicPrograms] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicPrograms = async () => {
      try {
        const res = await api.get('/lms/programs/public');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPublicPrograms(res.data.data);
        }
      } catch (e) {
        // Fallback to static programs list if server is starting
      }
    };
    fetchPublicPrograms();
  }, []);

  const calculatePricePerStudent = () => {
    let basePrice = 2.50;
    if (studentCount > 5000) basePrice = 0.75;
    else if (studentCount > 1500) basePrice = 1.00;
    else if (studentCount > 500) basePrice = 1.50;
    else if (studentCount > 100) basePrice = 2.00;

    if (billingCycle === 'yearly') {
      basePrice = basePrice * 0.8;
    }
    return parseFloat(basePrice.toFixed(2));
  };

  const calculateTotalPrice = () => {
    const rate = calculatePricePerStudent();
    const total = rate * studentCount;
    if (billingCycle === 'yearly') {
      return Math.round(total * 12).toLocaleString();
    }
    return Math.round(total).toLocaleString();
  };

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
          <div className="hidden md:flex items-center gap-4 md:gap-6 shrink-0">
            <Link href="#pricing" className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-widest whitespace-nowrap">
              Pricing
            </Link>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <button onClick={() => setIsContactOpen(true)} className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-widest whitespace-nowrap bg-transparent border-0 p-0 cursor-pointer outline-none">
              Contact
            </button>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-green-700 transition-colors uppercase tracking-widest whitespace-nowrap">
              Login
            </Link>
            <Link href="/signup" className="text-xs font-bold bg-green-700 text-white px-5 py-2.5 rounded-full hover:bg-green-800 transition-all shadow-md hover:scale-105 active:scale-95 uppercase tracking-widest whitespace-nowrap shrink-0">
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
            <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col gap-4 md:hidden z-50">
              <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-600 hover:text-green-700 transition-colors">
                Pricing
              </Link>
              <button onClick={() => { setIsContactOpen(true); setIsMobileMenuOpen(false); }} className="text-left text-sm font-bold text-slate-600 hover:text-green-700 transition-colors bg-transparent border-0 p-0 cursor-pointer outline-none">
                Contact
              </button>
              <div className="h-[1px] w-full bg-slate-100"></div>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-600 hover:text-green-700 transition-colors">
                Login
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-bold bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 transition-all shadow-md">
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
              Zarat.pk is Live
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              School of Agriculture <br />
              <span className="bg-gradient-to-r from-green-700 via-emerald-600 to-green-800 bg-clip-text text-transparent">
                PPSC Preparation Platform
              </span>
            </h1>
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
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Zarat.pk is proudly supported by</p>
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

        {/* Features Section */}
        <section id="features" className="w-full bg-green-50 py-24 border-y border-green-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">Everything you need to succeed in agriculture</h2>
              <p className="text-lg text-green-700">Comprehensive learning platform with practical tools and expert guidance for modern farming.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: <GraduationCap className="w-6 h-6 text-green-700" />, title: "Course Catalog", desc: "Browse agriculture courses from crop science to sustainable farming practices." },
                { icon: <Users className="w-6 h-6 text-green-700" />, title: "Student Management", desc: "Track your progress, grades, and learning achievements in one place." },
                { icon: <FileText className="w-6 h-6 text-green-700" />, title: "Resource Library", desc: "Access study materials, guides, and research papers on agriculture." },
                { icon: <MessageSquare className="w-6 h-6 text-green-700" />, title: "Expert Support", desc: "Connect with instructors and fellow learners through community forums." }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-green-200 hover:border-green-400 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-green-50 rounded-xl border border-green-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">{feature.title}</h3>
                  <p className="text-green-700 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4 tracking-tight">How Zarat.pk Works</h2>
            <p className="text-lg text-green-700">Start your agricultural learning journey in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign Up", desc: "Create your free account in minutes to get started." },
              { step: "02", title: "Explore Courses", desc: "Browse our collection of agriculture and farming courses." },
              { step: "03", title: "Learn & Practice", desc: "Study materials, complete assignments, and gain practical skills." },
              { step: "04", title: "Get Certified", desc: "Earn certificates to showcase your agricultural expertise." }
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
        <section id="courses" className="w-full bg-white py-24 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4 tracking-tight">Explore PPSC Preparation Programs</h2>
              <p className="text-lg text-green-700">Specialized agricultural competitive exam tracks designed for high success rates</p>
            </div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(publicPrograms.length > 0 ? publicPrograms : [
                {
                  _id: "",
                  name: "Water Management Officer (BS-17) | PPSC Preparation",
                  description: "Comprehensive preparation program for Water Management Officer (BS-17) PPSC exams, covering irrigation techniques, soil physics, hydrology, and agricultural engineering concepts.",
                  degreeLevel: "BS-17 Track",
                  code: "WMO-PPSC"
                },
                {
                  _id: "",
                  name: "Agriculture Officer (BS-17) | PPSC Preparation",
                  description: "Complete syllabus coverage for Agriculture Officer (BS-17) competitive test, focusing on agronomy, plant pathology, entomology, and agricultural economics.",
                  degreeLevel: "BS-17 Track",
                  code: "AO-PPSC"
                },
                {
                  _id: "",
                  name: "Assistant Director (BS-18) | PPSC Preparation",
                  description: "Specialized executive prep track for Assistant Director (BS-18) selection exams, featuring high-yield study materials, past paper analysis, and mock tests.",
                  degreeLevel: "BS-18 Track",
                  code: "AD-PPSC"
                }
              ]).map((program: any, i: number) => (
                <div key={program._id || i} className="bg-white rounded-2xl border border-green-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                  {/* Banner Header */}
                  <div className="w-full h-44 bg-gradient-to-br from-green-700 to-green-900 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-8xl font-black select-none">🌾</div>
                    <span className="inline-block self-start px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                      {program.degreeLevel || "PPSC Track"}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-snug drop-shadow-sm">{program.name || program.title}</h3>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col gap-3 flex-grow">
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
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-green-50 py-24 px-6 border-y border-green-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-green-900 mb-6 tracking-tight">Start Your Agricultural Journey Today</h2>
            <p className="text-xl text-green-700 mb-10 max-w-2xl mx-auto">Join thousands of students learning modern agriculture and farming on Zarat.pk</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-green-700 text-white rounded-xl font-medium text-lg hover:bg-green-800 transition-all shadow-md flex items-center justify-center gap-2">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 border border-green-200 rounded-xl font-medium text-lg hover:bg-green-50 transition-all shadow-sm flex items-center justify-center">
                Sign In
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
                Zarat.pk.<br /> Learn modern agriculture, master farming skills, and earn recognized certificates on Pakistan's leading agricultural education platform.
              </p>
            </div>

            {/* Product Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Product</h4>
              <ul className="space-y-4">
                <li><Link href="#features" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Features</Link></li>
                <li><Link href="#courses" className="text-sm hover:text-green-700 transition-all hover:translate-x-1 inline-block">Courses</Link></li>
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
              © {new Date().getFullYear()} Zarat.pk. All rights reserved.
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
                <h3 className="font-bold text-lg md:text-xl">Contact Zarat.pk</h3>
                <p className="text-green-100 text-xs mt-0.5">Get in touch with our team for support and inquiries</p>
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