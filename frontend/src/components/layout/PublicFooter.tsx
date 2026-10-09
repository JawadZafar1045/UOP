import Link from 'next/link';
import { ShieldCheck, Mail, Globe, ArrowUpRight, ChevronRight } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-white text-[#4d6477] border-t border-[#d5e0e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Column (Col 1-4) */}
          <div className="space-y-4 md:col-span-4">
            <Link href="/" className="inline-block group">
              <img
                src="/SIS-logo.png"
                alt="School of Information Security"
                className="h-14 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-[#4d6477] leading-relaxed max-w-sm">
              Empowering the next generation of cybersecurity and technology professionals with hands-on, practical skill training.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f4f8fb] border border-[#eaf3f7] text-[#0b6f7c] text-xs font-semibold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#0E8696] shrink-0" />
                <span>Verified School of Information Security Certification</span>
              </div>
            </div>
          </div>

          {/* Quick Links (Col 5-7) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-[#021F37] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E8696]" />
              Explore Courses
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/courses" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  All Courses Catalog
                </Link>
              </li>
              <li>
                <Link href="/courses?type=free" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Free Guided Courses
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#f4f8fb] text-[#0b6f7c] border border-[#eaf3f7] ml-1">Free</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=paid" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Professional Paid Tracks
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-[#021F37] border border-[#d5e0e8] ml-1">Pro</span>
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Cyber%20Security" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Cyber Security & VAPT
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links (Col 8-9) */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-[#021F37] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E8696]" />
              Student Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/lms" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Learning Dashboard
                </Link>
              </li>
              <li>
                <Link href="/certificates/verify/demo" className="text-[#4d6477] hover:text-[#0E8696] hover:translate-x-0.5 transition-all inline-flex items-center gap-1 group font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                  Certificate Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* About / Contact (Col 10-12) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-[#021F37] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E8696]" />
              About School of Information Security
            </h4>
            <p className="text-sm text-[#4d6477] mb-4 leading-relaxed">
              The School of Information Security is an industry-leading cybersecurity and technology education hub delivering practical real-world skills.
            </p>
            <div className="flex flex-col space-y-2.5">
              <a
                href="mailto:info@cszone.pk"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f4f8fb] hover:bg-[#f4f8fb] border border-[#d5e0e8]/80 hover:border-[#d5e0e8] text-[#021F37] hover:text-[#0b6f7c] transition-all text-xs font-semibold shadow-2xs group"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-[#d5e0e8] flex items-center justify-center text-[#0E8696] group-hover:scale-105 transition-transform shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">info@cszone.pk</span>
              </a>

              <a
                href="https://cszone.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f4f8fb] hover:bg-[#f4f8fb] border border-[#d5e0e8]/80 hover:border-[#d5e0e8] text-[#021F37] hover:text-[#0b6f7c] transition-all text-xs font-semibold shadow-2xs group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#d5e0e8] flex items-center justify-center text-[#0E8696] group-hover:scale-105 transition-transform shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">School of Information Security</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#5f7587] group-hover:text-[#0E8696] shrink-0" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-12 pt-8 border-t border-[#d5e0e8] flex flex-col sm:flex-row items-center justify-between text-xs text-[#4d6477] gap-4">
          <p>© {new Date().getFullYear()} School of Information Security, CS Zone Pvt. Limited. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <span className="inline-flex items-center gap-1.5 text-[#4d6477]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E8696]" /> Practical Skills Academy
            </span>
            <span className="text-[#5f7587]">|</span>
            <span>Learn. Build. Grow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
