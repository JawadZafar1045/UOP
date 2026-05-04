"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Award, CheckCircle2, XCircle, FileBadge } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

export default function PerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { currentCourse, myPerformance, isLoading, error, fetchMyPerformance, fetchCourse } = useLmsStore();
  const { user } = useStore();
  
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchCourse(courseId);
    if (isTeacherOrAdmin) {
      // Direct API call since it's not strongly typed in store yet
      api.get(`/lms/courses/${courseId}/performance`)
        .then(res => setClassPerformance(res.data?.data || []))
        .catch(console.error);
    } else {
      fetchMyPerformance(courseId);
    }
  }, [courseId, isTeacherOrAdmin, fetchCourse, fetchMyPerformance]);

  const handleGenerateCertificate = async (studentId: string) => {
    if (!confirm('Are you sure you want to generate a certificate for this student?')) return;
    setIsGenerating(true);
    try {
      await api.post(`/lms/courses/${courseId}/certificates/generate/${studentId}`);
      alert('Certificate generated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!confirm('Generate certificates for ALL eligible students who do not have one yet?')) return;
    setIsGenerating(true);
    try {
      const res = await api.post(`/lms/courses/${courseId}/certificates/generate-all`);
      alert(`Generated: ${res.data.data.generated.length}, Skipped: ${res.data.data.skipped.length}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading performance data...</div>;
  }

  const criteria = currentCourse?.completionCriteria || { minAttendancePercent: 75, minAssignmentScore: 60, minQuizScore: 60 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/lms/courses/${courseId}`} className="text-sm text-blue-600 hover:underline mb-2 block">&larr; Back to Course</Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Performance & Certificates</h1>
        </div>
        {isTeacherOrAdmin && (
          <button 
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-sm font-medium text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <FileBadge className="w-4 h-4" />
            Generate All Eligible
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {isTeacherOrAdmin ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">Attendance</th>
                <th className="px-6 py-4 font-medium">Assignments</th>
                <th className="px-6 py-4 font-medium">Quizzes</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classPerformance.map((perf) => (
                <tr key={perf.student._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div>{perf.student.name}</div>
                    <div className="text-xs text-slate-500 font-normal">{perf.student.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{perf.attendancePercent}%</td>
                  <td className="px-6 py-4 text-slate-600">{perf.assignmentScore}%</td>
                  <td className="px-6 py-4 text-slate-600">{perf.quizScore}%</td>
                  <td className="px-6 py-4">
                    {perf.eligible ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium border border-red-100" title={perf.reason}>
                        <XCircle className="w-3.5 h-3.5" /> Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {perf.eligible && (
                      <button 
                        onClick={() => handleGenerateCertificate(perf.student._id)}
                        disabled={isGenerating}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                      >
                        Generate Cert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {classPerformance.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No students enrolled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        myPerformance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Your Progress</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Attendance</span>
                    <span className={myPerformance.attendancePercent >= criteria.minAttendancePercent ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                      {myPerformance.attendancePercent}% <span className="text-slate-400 text-xs font-normal ml-1">/ {criteria.minAttendancePercent}% req</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${myPerformance.attendancePercent >= criteria.minAttendancePercent ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(myPerformance.attendancePercent, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Assignments</span>
                    <span className={myPerformance.assignmentScore >= criteria.minAssignmentScore ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                      {myPerformance.assignmentScore}% <span className="text-slate-400 text-xs font-normal ml-1">/ {criteria.minAssignmentScore}% req</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${myPerformance.assignmentScore >= criteria.minAssignmentScore ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(myPerformance.assignmentScore, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Quizzes</span>
                    <span className={myPerformance.quizScore >= criteria.minQuizScore ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                      {myPerformance.quizScore}% <span className="text-slate-400 text-xs font-normal ml-1">/ {criteria.minQuizScore}% req</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${myPerformance.quizScore >= criteria.minQuizScore ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(myPerformance.quizScore, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-8 flex flex-col items-center justify-center text-center ${myPerformance.eligible ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm ${myPerformance.eligible ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {myPerformance.eligible ? <Award className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${myPerformance.eligible ? 'text-emerald-900' : 'text-amber-900'}`}>
                {myPerformance.eligible ? 'You are eligible! 🎉' : 'Keep going!'}
              </h2>
              <p className={myPerformance.eligible ? 'text-emerald-700' : 'text-amber-700'}>
                {myPerformance.eligible 
                  ? "You have met all the criteria to earn your certificate for this course. If it hasn't been issued yet, your instructor will generate it soon."
                  : `You are not eligible yet. ${myPerformance.reason}`}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
