"use client";

import { useEffect, useState } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Award, Download, Share2, Calendar, FileBadge, ChevronLeft } from 'lucide-react';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';
import api from '@/services/api';
import { downloadCertificate } from '@/services/lms.service';

export default function CertificatesPage() {
  const { certificates, courses, isLoading, error, fetchMyCertificates, fetchCourses } = useLmsStore();
  const { user } = useStore();
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courseCertificates, setCourseCertificates] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingCourseCerts, setIsFetchingCourseCerts] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const isInstructor = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    if (isInstructor) {
      fetchCourses();
    } else {
      fetchMyCertificates();
    }
  }, [fetchMyCertificates, fetchCourses, isInstructor]);

  useEffect(() => {
    if (isInstructor && selectedCourseId) {
      fetchCertificatesForCourse(selectedCourseId);
    }
  }, [selectedCourseId, isInstructor]);

  const fetchCertificatesForCourse = async (courseId: string) => {
    setIsFetchingCourseCerts(true);
    try {
      const res: any = await api.get(`/lms/courses/${courseId}/certificates`);
      setCourseCertificates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingCourseCerts(false);
    }
  };

  const handleDownload = async (certId: string, certNum: string) => {
    setIsDownloading(certId);
    try {
      await downloadCertificate(certId, `Certificate_${certNum}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to download certificate.");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedCourseId) return;
    if (!confirm('Generate certificates for ALL eligible students who do not have one yet?')) return;
    setIsGenerating(true);
    try {
      const res: any = await api.post(`/lms/courses/${selectedCourseId}/certificates/generate-all`);
      const result = res.data;
      alert(`Generated: ${result.generated?.length || 0}, Skipped: ${result.skipped?.length || 0}`);
      fetchCertificatesForCourse(selectedCourseId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (isLoading && !isInstructor) {
    return <div className="p-8 flex justify-center"><Loader size="md" text="Loading certificates..." /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">


      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-3xl font-bold text-[#021F37] tracking-tight">
            {isInstructor ? 'Certificate Management' : 'My Certificates'}
          </h1>
          <p className="text-[#4d6477] mt-1.5 text-[15px]">
            {isInstructor 
              ? 'Issue and manage certificates for your students across courses.' 
              : 'View, download, and share your earned course certificates.'}
          </p>
        </div>
        
        {isInstructor && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto animate-fade-in-up animation-delay-100">
            <select 
              value={selectedCourseId} 
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-4 py-3 sm:py-2 bg-white border border-[#d5e0e8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0E8696]/20 transition-all outline-none w-full sm:min-w-[200px]"
            >
              <option value="">-- Select Course --</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateAll}
              disabled={!selectedCourseId || isGenerating}
              className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-[#0b6f7c] text-white text-sm font-bold rounded-xl hover:bg-[#021F37] active:scale-95 shadow-xs transition-all disabled:opacity-50 w-full sm:w-auto whitespace-nowrap cursor-pointer"
            >
              {isGenerating ? <><Loader size="sm" /> Generating...</> : <><FileBadge className="w-4 h-4 shrink-0" /> Generate All Eligible</>}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50/50 text-red-600 rounded-xl border border-red-100 backdrop-blur-sm">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {isInstructor ? (
        !selectedCourseId ? (
          <div className="bg-[#f4f8fb] border border-[#d5e0e8] border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Award className="w-8 h-8 text-[#5f7587]" />
            </div>
            <h3 className="text-xl font-bold text-[#021F37] mb-2">Select a course to manage</h3>
            <p className="text-[#4d6477] max-w-sm">Choose a course from the dropdown above to view issued certificates and generate new ones for eligible students.</p>
          </div>
        ) : isFetchingCourseCerts ? (
          <div className="py-20 flex justify-center"><Loader size="md" text="Loading course certificates..." /></div>
        ) : courseCertificates.length === 0 ? (
          <div className="bg-white border border-[#d5e0e8] rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <p className="text-[#4d6477] mb-6">No certificates have been issued for this course yet.</p>
            <Link href={`/lms/courses/${selectedCourseId}/performance`}>
              <button className="px-6 py-2.5 bg-[#f4f8fb] text-[#0E8696] text-sm font-bold rounded-xl hover:bg-[#eaf3f7] transition-all">
                Check Eligibility
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#d5e0e8] overflow-x-auto shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f4f8fb] text-[#4d6477] border-b border-[#d5e0e8]">
                <tr>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Certificate ID</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courseCertificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-[#f4f8fb]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#021F37]">{cert.studentId?.name || 'Unknown Student'}</div>
                      <div className="text-xs text-[#4d6477]">{cert.studentId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-semibold text-[#021F37]">
                        {cert.certificateNumber}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-[#4d6477] font-medium">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleDownload(cert._id, cert.certificateNumber)}
                        disabled={isDownloading === cert._id}
                        className="inline-flex items-center gap-1.5 text-[#0E8696] font-bold hover:underline disabled:opacity-50"
                      >
                        {isDownloading === cert._id ? <><Loader size="sm" /> Downloading...</> : 'View & Download'}
                      </button>
                      <button 
                        onClick={() => handleCopyLink(cert.verificationCode)}
                        className="text-[#4d6477] font-bold hover:text-[#021F37]"
                      >
                        {copiedCode === cert.verificationCode ? 'Link Copied!' : 'Copy Link'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        certificates.length === 0 ? (
          <div className="bg-white border border-[#d5e0e8]/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-[#f4f8fb] rounded-full flex items-center justify-center mb-8 shadow-inner">
              <Award className="w-12 h-12 text-[#0E8696]" />
            </div>
            <h3 className="text-2xl font-bold text-[#021F37] mb-2">No certificates yet</h3>
            <p className="text-[#4d6477] text-base max-w-md leading-relaxed mb-8">
              Complete a course and meet all the eligibility criteria to earn your first certificate. Your achievements will be showcased here.
            </p>
            <Link href="/lms">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#0b6f7c] text-white text-sm font-bold rounded-xl hover:bg-[#021F37] shadow-lg shadow-[#0E8696]/20 transition-all active:scale-[0.98]">
                Browse Courses
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in-up animation-delay-200">
            {certificates.map((cert) => (
              <div key={cert._id} className="bg-white rounded-2xl border border-[#d5e0e8]/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#0E8696]/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative">
                {/* Decorative Accent */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0E8696] to-[#0E8696]"></div>
                
                <div className="p-8 bg-gradient-to-br from-slate-50 to-[#f4f8fb]/30 border-b border-slate-100/60 relative overflow-hidden flex-1">
                  <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] transform rotate-12 group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-700">
                    <FileBadge className="w-48 h-48 text-[#021F37]" />
                  </div>
                  
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 border border-[#eaf3f7]">
                    <Award className="w-6 h-6 text-[#0E8696]" />
                  </div>
                  
                  <h3 className="font-bold text-[#021F37] text-xl leading-snug mb-3 relative z-10 group-hover:text-[#0b6f7c] transition-colors">
                    {cert.courseId?.title || 'Unknown Course'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[#4d6477] text-sm font-medium relative z-10">
                    <Calendar className="w-4 h-4 text-[#0b4a66]" />
                    <span>Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                
                <div className="p-6 bg-white">
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-[#5f7587] uppercase tracking-[0.2em] mb-2">Certificate ID</p>
                    <p className="font-mono text-xs text-[#021F37] bg-[#f4f8fb] px-3 py-2 rounded-lg border border-slate-100 inline-block font-semibold">
                      {cert.certificateNumber}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDownload(cert._id, cert.certificateNumber)}
                      disabled={isDownloading === cert._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b6f7c] text-white text-sm font-bold rounded-xl hover:bg-[#021F37] shadow-md shadow-[#0E8696]/10 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isDownloading === cert._id ? <><Loader size="sm" /> Processing...</> : <><Download className="w-4 h-4" /> Download</>}
                    </button>
                    <button 
                      onClick={() => handleCopyLink(cert.verificationCode)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#021F37] border border-[#d5e0e8] text-sm font-bold rounded-xl hover:bg-[#f4f8fb] hover:border-slate-300 transition-all active:scale-[0.98]"
                    >
                      <Share2 className="w-4 h-4 text-[#5f7587] group-hover:text-[#0E8696] transition-colors" />
                      {copiedCode === cert.verificationCode ? 'Copied!' : 'Share'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
