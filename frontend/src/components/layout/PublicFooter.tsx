import Link from 'next/link';
import { GraduationCap, ShieldCheck, Mail, Globe, Code, ArrowUpRight } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block group">
              <img
                src="/cszone-logo.png"
                alt="CSZone"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering the next generation of cybersecurity and technology professionals with hands-on, practical skill training.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Verified CSZone Certification
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Explore Courses
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  All Courses Catalog
                </Link>
              </li>
              <li>
                <Link href="/courses?type=free" className="hover:text-white transition-colors">
                  Free Guided Courses
                </Link>
              </li>
              <li>
                <Link href="/courses?type=paid" className="hover:text-white transition-colors">
                  Professional Paid Tracks
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Cyber%20Security" className="hover:text-white transition-colors">
                  Cyber Security & VAPT
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Student Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/lms" className="hover:text-white transition-colors">
                  Learning Dashboard
                </Link>
              </li>
              <li>
                <Link href="/certificates/verify/demo" className="hover:text-white transition-colors">
                  Certificate Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              About CSZone
            </h4>
            <p className="text-sm text-slate-400 mb-4">
              CSZone is an industry-leading cybersecurity and technology education hub delivering practical real-world skills.
            </p>
            <div className="flex flex-col space-y-2 text-sm text-slate-400">
              <a href="mailto:info@cszone.pk" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                info@cszone.pk
              </a>
              <a href="https://cszone.pk" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                cszone.pk
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CSZone Learning Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Learn. Build. Grow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
