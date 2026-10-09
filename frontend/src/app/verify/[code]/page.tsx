"use client";

import { useEffect, useState, use } from 'react';
import { CheckCircle, XCircle, Award, Calendar, Hash, RefreshCcw, Download } from 'lucide-react';
import axios from 'axios';

// Public API endpoint base URL, bypassing the authenticated api.ts instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [certData, setCertData] = useState<any>(null);

  useEffect(() => {
    const verifyCert = async () => {
      try {
        const response = await axios.get(`${API_URL}/lms/certificates/verify/${code}`);
        setCertData(response.data.data);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };

    verifyCert();
  }, [code]);

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center p-4 md:p-8">
      <div className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all duration-300 ${status === 'success' && certData ? 'max-w-6xl' : 'max-w-md'}`}>
        {status === 'loading' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <RefreshCcw className="w-12 h-12 text-[#0E8696] animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-[#021F37] mb-2">Verifying Certificate...</h2>
            <p className="text-[#4d6477] text-sm">Please wait while we check the blockchain/database.</p>
          </div>
        )}

        {status === 'success' && certData && (
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Verification Badge & Details Column */}
            <div className="lg:w-[400px] shrink-0 flex flex-col justify-between border-r border-slate-100 bg-white">
              <div>
                <div className="bg-green-700 p-8 flex flex-col items-center justify-center text-white text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-green-700" />
                  </div>
                  <h1 className="text-xl font-bold mb-1">Certificate Verified</h1>
                  <p className="text-white/80 text-xs font-medium">This is a valid credential.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="text-center pb-4 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-[#5f7587] uppercase tracking-widest mb-1.5">Awarded To</p>
                    <p className="text-2xl font-black text-[#021F37] tracking-tight">
                      {certData.student?.name || certData.studentId?.name || "Unknown Student"}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] flex items-center justify-center shrink-0">
                        <Award className="w-4.5 h-4.5 text-[#0E8696]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#5f7587] font-bold uppercase tracking-wider">Course Name</p>
                        <p className="text-sm font-semibold text-[#021F37] leading-snug">{certData.courseId?.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#f4f8fb] flex items-center justify-center shrink-0">
                        <Calendar className="w-4.5 h-4.5 text-[#0E8696]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#5f7587] font-bold uppercase tracking-wider">Issue Date</p>
                        <p className="text-sm font-semibold text-[#021F37]">{new Date(certData.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Hash className="w-4.5 h-4.5 text-[#4d6477]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#5f7587] font-bold uppercase tracking-wider">Certificate ID</p>
                        <p className="text-sm font-mono font-bold text-[#021F37] break-all">{certData.certificateNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-[#f4f8fb]/50 text-center">
                <p className="text-[10px] text-[#5f7587] font-semibold uppercase tracking-wider mb-1">Issued By</p>
                <p className="text-xs font-bold text-[#4d6477]">Academy ACROTYX</p>
              </div>
            </div>

            {/* Certificate PDF Document Column */}
            <div className="flex-1 bg-slate-900 flex flex-col">
              {/* Toolbar */}
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700/80">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5f7587]">Live Secure Preview</span>
                </div>
                <a 
                  href={`${API_URL}/lms/certificates/verify/${code}/pdf`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-[#0b6f7c] hover:bg-[#021F37] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-[#0E8696]/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>
              </div>
              
              {/* PDF Viewer Container */}
              <div className="flex-1 relative min-h-[500px] lg:min-h-0 bg-slate-950 flex items-center justify-center p-4">
                <iframe 
                  src={`${API_URL}/lms/certificates/verify/${code}/pdf`} 
                  className="w-full h-full border-0 rounded-xl bg-white shadow-2xl"
                  title="Certificate Document"
                />
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col h-full">
            <div className="bg-red-500 p-8 flex flex-col items-center justify-center text-white text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Certificate Not Found</h1>
            </div>
            
            <div className="p-8 text-center">
              <p className="text-[#4d6477] mb-6">
                This certificate could not be verified. It may be invalid, revoked, or the URL may be incorrect.
              </p>
              <div className="p-4 bg-[#f4f8fb] rounded-lg border border-slate-100 text-sm text-[#4d6477] break-all font-mono">
                Code: {code}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
