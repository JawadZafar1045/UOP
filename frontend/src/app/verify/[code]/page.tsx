"use client";

import { useEffect, useState, use } from 'react';
import { CheckCircle, XCircle, Award, Calendar, Hash, RefreshCcw } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {status === 'loading' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Verifying Certificate...</h2>
            <p className="text-slate-500 text-sm">Please wait while we check the blockchain/database.</p>
          </div>
        )}

        {status === 'success' && certData && (
          <div className="flex flex-col h-full">
            <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center text-white text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Certificate Verified</h1>
              <p className="text-emerald-100 text-sm font-medium">This is a valid credential.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center pb-6 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">Awarded To</p>
                <p className="text-2xl font-bold text-slate-900">{certData.student?.name}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">For completing the course</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{certData.courseId?.title}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Issue Date</p>
                    <p className="text-sm font-semibold text-slate-900">{new Date(certData.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Hash className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Certificate Number</p>
                    <p className="text-sm font-mono text-slate-900">{certData.certificateNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">This certificate was issued by</p>
                <p className="text-sm font-semibold text-slate-700">Unified Operations Platform</p>
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
              <p className="text-slate-600 mb-6">
                This certificate could not be verified. It may be invalid, revoked, or the URL may be incorrect.
              </p>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-500 break-all font-mono">
                Code: {code}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
