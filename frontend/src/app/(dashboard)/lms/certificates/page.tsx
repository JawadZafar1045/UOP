"use client";

import { useEffect, useState } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Award, Download, Share2, Calendar, FileBadge } from 'lucide-react';
import Link from 'next/link';

export default function CertificatesPage() {
  const { certificates, isLoading, error, fetchMyCertificates } = useLmsStore();
  const { user } = useStore();
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // This page is only for students, but it's safe to just fetch. 
    // The backend endpoint `/lms/certificates/mine` returns certificates for the current user.
    fetchMyCertificates();
  }, [fetchMyCertificates]);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (isLoading && certificates.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading your certificates...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Certificates</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">View, download, and share your earned course certificates.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/50 text-red-600 rounded-xl border border-red-100 backdrop-blur-sm">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <Award className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No certificates yet</h3>
          <p className="text-slate-500 text-base max-w-md leading-relaxed mb-8">
            Complete a course and meet all the eligibility criteria to earn your first certificate. Your achievements will be showcased here.
          </p>
          <Link href="/lms">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
              Browse Courses
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col group relative">
              {/* Decorative Accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50/30 border-b border-slate-100/60 relative overflow-hidden flex-1">
                <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] transform rotate-12 group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-700">
                  <FileBadge className="w-48 h-48 text-blue-900" />
                </div>
                
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 border border-blue-100">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                
                <h3 className="font-bold text-slate-900 text-xl leading-snug mb-3 relative z-10 group-hover:text-blue-700 transition-colors">
                  {cert.courseId?.title || 'Unknown Course'}
                </h3>
                
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium relative z-10">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              
              <div className="p-6 bg-white">
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Certificate ID</p>
                  <p className="font-mono text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 inline-block font-semibold">
                    {cert.certificateNumber}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <a 
                    href={cert.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button 
                    onClick={() => handleCopyLink(cert.verificationCode)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                  >
                    <Share2 className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    {copiedCode === cert.verificationCode ? 'Copied!' : 'Share'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

  );
}
