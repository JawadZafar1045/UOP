"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { FileText, Plus, UploadCloud, XCircle, Calendar, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { 
    assignments, isLoading, error, fetchAssignments, createAssignment, 
    submitAssignment, fetchAssignmentSubmissions, gradeAssignment, 
    currentAssignmentSubmissions 
  } = useLmsStore();
  const { user } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  
  // Create Assignment State
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    instructions: '',
    maxMarks: '100',
    dueDate: ''
  });
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);

  // Submission State (Student)
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Grading State (Instructor)
  const [gradingData, setGradingData] = useState({ studentId: '', score: '', feedback: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchAssignments(courseId);
  }, [courseId, fetchAssignments]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('title', createData.title);
      formData.append('description', createData.description);
      formData.append('instructions', createData.instructions);
      formData.append('maxMarks', createData.maxMarks);
      formData.append('dueDate', createData.dueDate);
      
      if (materialFiles.length > 0) {
        materialFiles.forEach(f => formData.append('materials', f));
      }

      await createAssignment(formData);
      setShowCreateModal(false);
      setCreateData({ title: '', description: '', instructions: '', maxMarks: '100', dueDate: '' });
      setMaterialFiles([]);
      fetchAssignments(courseId);
    } catch (err) {
      console.error(err);
      alert('Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      fetchAssignments(courseId);
    } catch (err) {
      console.error(err);
      alert('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setIsSubmitting(true);
    try {
      await gradeAssignment(activeAssignment._id, gradingData.studentId, {
        score: Number(gradingData.score),
        feedback: gradingData.feedback
      });
      setGradingData({ studentId: '', score: '', feedback: '' });
      fetchAssignmentSubmissions(activeAssignment._id);
      fetchAssignments(courseId);
    } catch (err) {
      console.error(err);
      alert('Failed to grade assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDownloadUrl = (url: string) => {
    if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
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
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-all">
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
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{assignment.description || 'No description'}</p>
                
                {assignment.materials && assignment.materials.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Materials</p>
                    <div className="flex flex-wrap gap-2">
                      {assignment.materials.map((m: any, idx: number) => (
                        <a key={idx} href={getDownloadUrl(m.url)} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors">
                          <Download className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{m.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    {assignment.dueDate && <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                  </div>
                  
                  {isTeacherOrAdmin ? (
                    <button 
                      onClick={() => { setActiveAssignment(assignment); fetchAssignmentSubmissions(assignment._id); setShowSubmissionsModal(true); }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
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
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
                            Score: {mySub.marks}/{assignment.maxMarks}
                          </span>
                          {mySub.feedback && (
                            <div className="mt-1 w-full bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-left">
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Instructor Feedback</p>
                              <p className="text-xs text-indigo-800 leading-relaxed italic">&ldquo;{mySub.feedback}&rdquo;</p>
                            </div>
                          )}
                        </div>
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

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8 overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Create New Assignment</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input type="text" required value={createData.title} onChange={e => setCreateData({...createData, title: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Assignment Title" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description (Short summary)</label>
                  <input type="text" value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="A brief description for the card view" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Instructions</label>
                  <textarea rows={4} value={createData.instructions} onChange={e => setCreateData({...createData, instructions: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Provide detailed instructions for the students..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Marks</label>
                  <input type="number" required value={createData.maxMarks} onChange={e => setCreateData({...createData, maxMarks: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date (Deadline)</label>
                  <input type="datetime-local" required value={createData.dueDate} onChange={e => setCreateData({...createData, dueDate: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reference Materials (Optional)</label>
                  <input type="file" multiple onChange={e => setMaterialFiles(Array.from(e.target.files || []))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal (Instructor) */}
      {showSubmissionsModal && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Submissions: {activeAssignment.title}</h2>
                <p className="text-sm text-slate-500">Max Marks: {activeAssignment.maxMarks}</p>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex">
              {/* Submission List */}
              <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-4 space-y-4">
                {currentAssignmentSubmissions?.submissions?.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No submissions yet.</div>
                ) : (
                  currentAssignmentSubmissions?.submissions?.map((sub: any) => (
                    <div 
                      key={sub._id} 
                      onClick={() => setGradingData({ studentId: sub.studentId._id, score: sub.marks || '', feedback: sub.feedback || '' })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${gradingData.studentId === sub.studentId._id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900">{sub.studentId.name}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{new Date(sub.submittedAt).toLocaleString()}</p>
                      {sub.text && <p className="text-xs text-slate-600 line-clamp-1 italic">"{sub.text}"</p>}
                      {sub.fileUrl && <div className="mt-2 text-[10px] text-blue-500 font-medium flex items-center gap-1"><Download className="w-3 h-3" /> File attached</div>}
                    </div>
                  ))
                )}
              </div>

              {/* Grading Panel */}
              <div className="w-1/2 p-6 bg-slate-50/50 overflow-y-auto">
                {gradingData.studentId ? (
                  <form onSubmit={handleGrade} className="space-y-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Grade Student
                    </h3>
                    
                    {/* Student Work Display */}
                    {(() => {
                      const sub = currentAssignmentSubmissions?.submissions?.find((s: any) => s.studentId._id === gradingData.studentId);
                      if (!sub) return null;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Student Submission</p>
                          {sub.text && (
                            <div className="mb-4">
                              <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{sub.text}</p>
                            </div>
                          )}
                          {sub.fileUrl && (
                            <a 
                              href={getDownloadUrl(sub.fileUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              download 
                              className="flex items-center gap-2 w-full justify-center py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download Submitted File
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Score (Out of {activeAssignment.maxMarks})</label>
                      <input type="number" required max={activeAssignment.maxMarks} value={gradingData.score} onChange={e => setGradingData({...gradingData, score: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Feedback for Student</label>
                      <textarea rows={4} value={gradingData.feedback} onChange={e => setGradingData({...gradingData, feedback: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Provide constructive feedback..." />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-sm font-bold text-white rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all">
                      {isSubmitting ? 'Saving...' : 'Submit Grade & Feedback'}
                    </button>
                  </form>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a submission to start grading</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal (Student) */}
      {showModal && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
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
