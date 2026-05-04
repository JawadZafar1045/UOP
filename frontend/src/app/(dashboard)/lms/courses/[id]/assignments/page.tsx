"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { FileText, Plus, UploadCloud, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { assignments, isLoading, error, fetchAssignments, submitAssignment } = useLmsStore();
  const { user } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchAssignments(courseId);
  }, [courseId, fetchAssignments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionText) formData.append('text', submissionText);
      if (file) formData.append('file', file);
      
      await submitAssignment(activeAssignment._id, formData);
      setShowModal(false);
      setActiveAssignment(null);
      setSubmissionText('');
      setFile(null);
      fetchAssignments(courseId); // Refresh to see updated status
    } catch (err) {
      console.error(err);
      alert('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && assignments.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/lms/courses/${courseId}`} className="text-sm text-blue-600 hover:underline mb-2 block">&larr; Back to Course</Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Assignments</h1>
        </div>
        {isTeacherOrAdmin && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No assignments yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => {
            const mySub = assignment.submissions?.find((s: any) => s.studentId === user?._id || s.studentId?._id === user?._id);
            const status = mySub ? mySub.status : 'Not Submitted';
            
            return (
              <div key={assignment._id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-slate-900 text-lg">{assignment.title}</h3>
                  <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{assignment.maxMarks} pts</span>
                </div>
                <p className="text-sm text-slate-600 mb-6 flex-1">{assignment.description || 'No description'}</p>
                
                <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    {assignment.dueDate && <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                  </div>
                  
                  {isTeacherOrAdmin ? (
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      View Submissions ({assignment.submissions?.length || 0})
                    </button>
                  ) : (
                    <div>
                      {status === 'Not Submitted' ? (
                        <button 
                          onClick={() => { setActiveAssignment(assignment); setShowModal(true); }}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100"
                        >
                          Submit Work
                        </button>
                      ) : status === 'graded' ? (
                        <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
                          Score: {mySub.marks}/{assignment.maxMarks}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium text-sm bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100">
                          Submitted (Pending)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal (Student) */}
      {showModal && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Submit: {activeAssignment.title}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Answer (Optional)</label>
                <textarea 
                  rows={4} 
                  value={submissionText} 
                  onChange={e => setSubmissionText(e.target.value)} 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="Type your answer or comments here..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attach File (Optional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-slate-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={isSubmitting || (!submissionText && !file)} className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
