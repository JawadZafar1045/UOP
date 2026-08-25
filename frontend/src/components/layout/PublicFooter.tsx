import Link from 'next/link';
import { ShieldCheck, Mail, Globe, ArrowUpRight, ChevronRight } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Column (Col 1-4) */}
          <div className="space-y-4 md:col-span-4">
            <Link href="/" className="inline-block group">
              <img
                src="/cszone-logo.png"
                alt="CSZone"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Empowering the next generation of cybersecurity and technology professionals with hands-on, practical skill training.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Verified CSZone Certification</span>
              </div>
            </div>
          </div>

          {/* Quick Links (Col 5-7) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Explore Courses
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/courses" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  All Courses Catalog
                </Link>
              </li>
              <li>
                <Link href="/courses?type=free" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Free Guided Courses
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100 ml-1">Free</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=paid" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Professional Paid Tracks
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 ml-1">Pro</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Cyber%20Security" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Cyber Security & VAPT
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links (Col 8-9) */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Student Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/lms" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Learning Dashboard
                </Link>
              </li>
              <li>
                <Link href="/certificates/verify/demo" className="text-slate-600 hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  Certificate Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* About / Contact (Col 10-12) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              About CSZone
            </h4>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              CSZone is an industry-leading cybersecurity and technology education hub delivering practical real-world skills.
            </p>
            <div className="flex flex-col space-y-2.5">
              <a
                href="mailto:info@cszone.pk"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-all text-xs font-semibold shadow-2xs group"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">info@cszone.pk</span>
              </a>

              <a
                href="https://cszone.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-all text-xs font-semibold shadow-2xs group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">cszone.pk</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CSZone Learning Platform. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Practical Skills Academy
            </span>
            <span className="text-slate-300">|</span>
            <span>Learn. Build. Grow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
