'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  Send
} from 'lucide-react';

export default function LandingPage() {
  const [studentCount, setStudentCount] = useState(250);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
        <nav className="pointer-events-auto flex items-center gap-6 md:gap-8 px-6 py-2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl shadow-blue-900/10 transition-all duration-300 ring-1 ring-black/5">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center cursor-pointer bg-transparent border-0 p-0 outline-none hover:opacity-85 transition-opacity"
            aria-label="Scroll to top"
          >
            <img src="/acrotyx-logo.png" alt="Logo" className="h-8 md:h-8 w-auto object-contain" />
          </button>
          <div className="hidden md:block h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-5 md:gap-6">
            <Link href="#pricing" className="text-[10px] md:text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-widest">
              Pricing
            </Link>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <button onClick={() => setIsContactOpen(true)} className="text-[10px] md:text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-widest bg-transparent border-0 p-0 cursor-pointer outline-none">
              Contact
            </button>
            <div className="h-3 w-[1px] bg-slate-200"></div>
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
                src="/Hero.png"
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
                LMS ACROTYX is live
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#FFFFFF] tracking-tight mb-6 leading-[1.15]">
                Empower your learning, courses, and education in one place
              </h1>
              <p className="text-lg md:text-xl text-slate-100 max-w-2xl mb-10 leading-relaxed font-medium drop-shadow-sm">
                The modern learning management system that brings courses, live sessions, assignments, and academic tracking into a single workspace.
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

        {/* Branding / Partners Section */}
        <section className="w-full bg-slate-50 pt-4 pb-16 border-b border-slate-200/50">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">LMS ACROTYX is proudly supported by</p>
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
        <section id="features" className="w-full bg-white py-24 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to master your courses</h2>
              <p className="text-lg text-slate-600">Powerful, interconnected modules designed to enhance your learning and academic collaboration.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: <GraduationCap className="w-6 h-6 text-indigo-600" />, title: "Course Catalog", desc: "Browse and enroll in high-quality academic courses curated by teachers." },
                { icon: <Users className="w-6 h-6 text-teal-600" />, title: "Student Management", desc: "Centralize student records, profiles, and performance logs." },
                { icon: <FileText className="w-6 h-6 text-emerald-600" />, title: "Resource Sharing", desc: "Access, store, and share lectures, assignments, and notes securely." },
                { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, title: "Real-time Communication", desc: "Connect with classmates and instructors through chats and announcements." }
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">How LMS ACROTYX Works</h2>
            <p className="text-lg text-slate-600">A seamless flow from course registration to academic success.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Register", desc: "Create an account using your college code." },
              { step: "02", title: "Enroll in Courses", desc: "Access the learning material provided by teachers." },
              { step: "03", title: "Learn & Participate", desc: "Attend live sessions, complete quizzes, and submit work." },
              { step: "04", title: "Earn Certificates", desc: "Download verifiable certificates upon course completion." }
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

        {/* Pricing Section */}
        <section id="pricing" className="w-full bg-slate-50 py-24 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Simple, Volume-Based Pricing</h2>
              <p className="text-lg text-slate-600">The more students you host on LMS ACROTYX, the less you pay per student. Simple as that.</p>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-slate-500'}`}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-12 h-6 bg-blue-600 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center"
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`}></div>
                </button>
                <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-slate-500'}`}>
                  Yearly
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase tracking-wider">Save 20%</span>
                </span>
              </div>
            </div>

            {/* Calculator Card */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">

              {/* Left Column: Slider and Tiers */}
              <div className="md:col-span-7 p-8 md:p-10 space-y-8 flex flex-col justify-center text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Students</label>
                    <span className="text-3xl font-black text-blue-600 tracking-tight">{studentCount} <span className="text-sm font-medium text-slate-500">Students</span></span>
                  </div>

                  {/* Slider */}
                  <div className="relative pt-2">
                    <input
                      type="range"
                      min="10"
                      max="5000"
                      step="10"
                      value={studentCount}
                      onChange={e => setStudentCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none border border-slate-200"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                      <span>10</span>
                      <span>1,000</span>
                      <span>2,500</span>
                      <span>5,000+</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Tiers Progress Indicator */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount Tiers (Per Student/mo)</h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
                    {[
                      { range: "1-100", price: "$2.50", active: studentCount <= 100 },
                      { range: "101-500", price: "$2.00", active: studentCount > 100 && studentCount <= 500 },
                      { range: "501-1500", price: "$1.50", active: studentCount > 500 && studentCount <= 1500 },
                      { range: "1501-5000", price: "$1.00", active: studentCount > 1500 && studentCount <= 5000 },
                      { range: "5000+", price: "$0.75", active: studentCount > 5000 }
                    ].map((tier, index) => (
                      <div
                        key={index}
                        className={`p-2 py-3 rounded-xl border transition-all duration-300 ${tier.active
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm scale-[1.03]'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                      >
                        <div className="truncate mb-1">{tier.range}</div>
                        <div className="text-xs font-black">{tier.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Calculated Price */}
              <div className="md:col-span-5 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-8 md:p-10 flex flex-col justify-between items-center text-center">
                <div className="w-full space-y-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Cost</h3>

                  <div className="space-y-1">
                    <span className="text-5xl font-black text-slate-900 tracking-tight">
                      ${calculateTotalPrice()}
                    </span>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mt-1">
                      per {billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-inner flex justify-between items-center text-left">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Rate / Student</span>
                      <span className="text-sm font-bold text-slate-800">${calculatePricePerStudent()}/mo equivalent</span>
                    </div>
                    <span className="px-2 py-1 text-[10px] font-extrabold bg-blue-100 text-blue-700 rounded-lg uppercase tracking-wider">
                      {Math.round(((2.5 - (billingCycle === 'yearly' ? calculatePricePerStudent() / 0.8 : calculatePricePerStudent())) / 2.5) * 100)}% Volume Off
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-8 md:pt-0">
                  <button
                    onClick={() => setIsContactOpen(true)}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Start Free Trial <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                  <p className="text-[10px] font-semibold text-slate-400">14-day free trial • No credit card required</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-blue-50 py-24 px-6 border-y border-blue-100">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Start using LMS ACROTYX today</h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">Join students and teachers managing their academic journeys on LMS ACROTYX.</p>
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
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 mb-8 group cursor-pointer bg-transparent border-0 p-0 outline-none hover:opacity-85 transition-opacity"
                aria-label="Scroll to top"
              >
                <img src="/acrotyx-logo.png" alt="Logo" className="h-10 w-auto object-contain" />
              </button>
              <p className="text-slate-500 mb-8 leading-relaxed max-w-sm text-sm">
                LMS ACROTYX.<br /> Manage your courses, classes, grades, and academic communication from a single platform.
              </p>
            </div>

            {/* Product Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Product</h4>
              <ul className="space-y-4">
                <li><Link href="#features" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Features</Link></li>
                <li><Link href="#pricing" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Pricing</Link></li>
                <li><Link href="/login" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Login</Link></li>
                <li><Link href="/signup" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">Sign Up</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block">About Us</a></li>
                <li><button onClick={() => setIsContactOpen(true)} className="text-sm hover:text-blue-600 transition-all hover:translate-x-1 inline-block text-left bg-transparent border-0 p-0 cursor-pointer outline-none">Contact</button></li>
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
              © {new Date().getFullYear()} LMS ACROTYX. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
              <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-blue-600 transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-blue-600 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg md:text-xl">Contact LMS ACROTYX</h3>
                <p className="text-blue-100 text-xs mt-0.5">Send your queries to info@cszone.pk</p>
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-slate-800"
                    placeholder="Write details of your query..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 text-lg">Thank You!</h4>
                <p className="text-slate-600 text-sm max-w-sm mx-auto">
                  Your query details have been captured. A mail application has been opened to send this information to <span className="font-semibold text-blue-600">info@cszone.pk</span>.
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