"use client";

import { useEffect, useState } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Award, Download, Share2, Calendar, FileBadge } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Certificates</h1>
          <p className="text-sm text-slate-500 mt-1">View, download, and share your earned course certificates.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {certificates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Award className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">No certificates yet</h3>
          <p className="text-slate-500 max-w-sm">
            Complete a course and meet all the eligibility criteria to earn your first certificate. Keep up the great work!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-100 relative overflow-hidden flex-1">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                  <FileBadge className="w-32 h-32 text-blue-600" />
                </div>
                
                <Award className="w-10 h-10 text-blue-600 mb-4 relative z-10" />
                
                <h3 className="font-bold text-slate-900 text-xl leading-tight mb-2 relative z-10">
                  {cert.courseId?.title || 'Unknown Course'}
                </h3>
                
                <p className="text-sm text-slate-600 flex items-center gap-1.5 relative z-10">
                  <Calendar className="w-4 h-4" />
                  Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <div className="p-6 bg-white">
                <div className="mb-6 space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certificate Number</p>
                  <p className="font-mono text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 inline-block">
                    {cert.certificateNumber}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <a 
                    href={cert.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                  <button 
                    onClick={() => handleCopyLink(cert.verificationCode)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
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
