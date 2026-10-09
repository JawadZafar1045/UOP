"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { FileText, Plus, UploadCloud, XCircle, Calendar, Download, CheckCircle2, AlertCircle, ChevronLeft, ArrowRight, Clock, Edit2, Trash2 } from 'lucide-react';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';

export default function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { 
    assignments, isLoading, error, fetchAssignments, createAssignment, 
    submitAssignment, fetchAssignmentSubmissions, gradeAssignment, 
    currentAssignmentSubmissions, deleteAssignment 
  } = useLmsStore();
  const { user } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState<string | null>(null);
  const { updateAssignment } = useLmsStore();
  
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

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing && editAssignmentId) {
        // Simple update without file handling for now (as createAssignment handles FormData)
        // Instructors can update text fields.
        await updateAssignment(editAssignmentId, {
          title: createData.title,
          description: createData.description,
          instructions: createData.instructions,
          maxMarks: Number(createData.maxMarks),
          dueDate: createData.dueDate
        });
      } else {
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
      }
      setShowCreateModal(false);
      setCreateData({ title: '', description: '', instructions: '', maxMarks: '100', dueDate: '' });
      setMaterialFiles([]);
      setIsEditing(false);
      setEditAssignmentId(null);
      fetchAssignments(courseId);
    } catch (err) {
      console.error(err);
      alert('Failed to save assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (assignment: any) => {
    setIsEditing(true);
    setEditAssignmentId(assignment._id);
    setCreateData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      maxMarks: String(assignment.maxMarks),
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : ''
    });
    setShowCreateModal(true);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditAssignmentId(null);
    setCreateData({ title: '', description: '', instructions: '', maxMarks: '100', dueDate: '' });
    setMaterialFiles([]);
    setShowCreateModal(true);
  };

  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the assignment "${title}"? This will permanently delete all student submissions and associated materials.`)) {
      return;
    }
    try {
      await deleteAssignment(assignmentId);
      alert('Assignment deleted successfully!');
      fetchAssignments(courseId);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to delete assignment');
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

  const handleFileDownload = async (url: string, name?: string) => {
    try {
      const { downloadFileByUrl } = await import('@/services/lms.service');
      await downloadFileByUrl(url, name || 'file');
    } catch (err) {
      console.error(err);
      alert('Failed to download file.');
    }
  };

  if (isLoading && assignments.length === 0) {
    return <div className="p-8 flex justify-center"><Loader size="md" text="Loading assignments..." /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/lms/courses/${courseId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b6f7c] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#021F37] transition-all group active:scale-[0.98] shadow-[#0E8696]/20">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to Course
          </Link>
          
          {isTeacherOrAdmin && (
            <button 
              onClick={openCreateModal} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0b6f7c] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#021F37] transition-all active:scale-[0.98] shadow-[#0E8696]/20"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Assignment
            </button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[#021F37] tracking-tight">Assignments</h1>
          <p className="text-[#4d6477] mt-1.5 text-[15px]">Manage and review student course work and submissions.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/50 text-red-600 rounded-xl border border-red-100 backdrop-blur-sm">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white border border-[#d5e0e8]/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-[#f4f8fb] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <FileText className="w-10 h-10 text-[#5f7587]" />
          </div>
          <h3 className="text-2xl font-bold text-[#021F37] mb-2">No assignments yet</h3>
          <p className="text-[#4d6477] text-base max-w-sm leading-relaxed">
            Create your first assignment to engage your students and track their progress.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {assignments.map((assignment) => {
            const mySub = assignment.submissions?.find((s: any) => s.studentId === user?._id || s.studentId?._id === user?._id);
            const status = mySub ? mySub.status : 'Not Submitted';
            
            return (
              <div key={assignment._id} className="bg-white rounded-2xl border border-[#d5e0e8]/60 hover:border-[#d5e0e8]/60 shadow-sm hover:shadow-xl hover:shadow-[#0E8696]/5 transition-all duration-300 flex flex-col group p-7">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="font-bold text-[#021F37] text-xl leading-snug group-hover:text-[#0E8696] transition-colors">
                    {assignment.title}
                  </h3>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center px-3 py-1 bg-[#f4f8fb] text-[#0b6f7c] text-xs font-bold rounded-full border border-[#eaf3f7] shadow-sm">
                      {assignment.maxMarks} pts
                    </span>
                    {isTeacherOrAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => openEditModal(assignment)}
                          className="p-1.5 text-[#5f7587] hover:text-[#0E8696] hover:bg-[#f4f8fb] rounded-lg transition-all"
                          title="Edit Assignment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(assignment._id, assignment.title)}
                          className="p-1.5 text-[#5f7587] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-[15px] text-[#4d6477] line-clamp-2 leading-relaxed mb-6">
                  {assignment.description || 'No description provided for this assignment.'}
                </p>
                
                {assignment.materials && assignment.materials.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-[#5f7587] uppercase tracking-widest mb-3">Materials</p>
                    <div className="flex flex-wrap gap-2">
                      {assignment.materials.map((m: any, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => handleFileDownload(m.url, m.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f8fb] text-[#4d6477] rounded-lg text-xs font-semibold hover:bg-[#f4f8fb] hover:text-[#0b6f7c] border border-slate-100 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5f7587]">
                    <Calendar className="w-4 h-4 text-[#0b4a66]/60" />
                    <span className="text-xs font-medium">
                      {assignment.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}` : 'No due date'}
                    </span>
                  </div>
                  
                  {isTeacherOrAdmin ? (
                    <button 
                      onClick={() => { setActiveAssignment(assignment); fetchAssignmentSubmissions(assignment._id); setShowSubmissionsModal(true); }}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0E8696] hover:text-[#0b6f7c] transition-colors group/btn"
                    >
                      Submissions ({assignment.submissions?.length || 0})
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <div className="flex items-center">
                      {status === 'Not Submitted' ? (
                        <button 
                          onClick={() => { setActiveAssignment(assignment); setShowModal(true); }}
                          className="inline-flex items-center justify-center px-5 py-2 bg-[#0b6f7c] text-white text-sm font-bold rounded-xl hover:bg-[#021F37] shadow-md shadow-[#0E8696]/10 transition-all active:scale-[0.98]"
                        >
                          Submit Work
                        </button>
                      ) : status === 'graded' ? (
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 font-bold text-xs rounded-lg border border-green-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {mySub.marks}/{assignment.maxMarks} Marks
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg border border-amber-100">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Pending Review
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
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#f4f8fb]/50">
              <h2 className="text-xl font-bold text-[#021F37]">{isEditing ? 'Edit Assignment' : 'Create New Assignment'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#5f7587] hover:text-[#4d6477]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#021F37] mb-1">Title</label>
                  <input type="text" required value={createData.title} onChange={e => setCreateData({...createData, title: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" placeholder="Assignment Title" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#021F37] mb-1">Description (Short summary)</label>
                  <input type="text" value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" placeholder="A brief description for the card view" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#021F37] mb-1">Detailed Instructions</label>
                  <textarea rows={4} value={createData.instructions} onChange={e => setCreateData({...createData, instructions: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" placeholder="Provide detailed instructions for the students..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#021F37] mb-1">Max Marks</label>
                  <input type="number" required value={createData.maxMarks} onChange={e => setCreateData({...createData, maxMarks: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#021F37] mb-1">Due Date (Deadline)</label>
                  <input type="datetime-local" required value={createData.dueDate} onChange={e => setCreateData({...createData, dueDate: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#021F37] mb-1">Reference Materials (Optional)</label>
                  <input type="file" multiple onChange={e => setMaterialFiles(Array.from(e.target.files || []))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#f4f8fb] file:text-[#0b6f7c] hover:file:bg-[#eaf3f7]" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-[#4d6477] hover:text-[#021F37]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-[#0b6f7c] text-sm font-medium text-white rounded-lg shadow-sm hover:bg-[#021F37] disabled:opacity-50">
                  {isSubmitting ? <><Loader size="sm" />{isEditing ? 'Updating...' : 'Creating...'}</> : (isEditing ? 'Update Assignment' : 'Create Assignment')}
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
                <h2 className="text-xl font-bold text-[#021F37]">Submissions: {activeAssignment.title}</h2>
                <p className="text-sm text-[#4d6477]">Max Marks: {activeAssignment.maxMarks}</p>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="text-[#5f7587] hover:text-[#4d6477]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto sm:overflow-hidden flex flex-col sm:flex-row">
              {/* Submission List */}
              <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-slate-100 sm:overflow-y-auto p-4 space-y-4 min-h-[30vh] sm:min-h-0">
                {currentAssignmentSubmissions?.submissions?.length === 0 ? (
                  <div className="text-center py-12 text-[#5f7587]">No submissions yet.</div>
                ) : (
                  currentAssignmentSubmissions?.submissions?.map((sub: any) => (
                    <div 
                      key={sub._id} 
                      onClick={() => setGradingData({ studentId: sub.studentId._id, score: sub.marks || '', feedback: sub.feedback || '' })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${gradingData.studentId === sub.studentId._id ? 'border-[#0E8696] bg-[#f4f8fb] shadow-sm' : 'border-slate-100 hover:border-[#d5e0e8] bg-white'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-[#021F37]">{sub.studentId.name}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${sub.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#4d6477] mb-3">{new Date(sub.submittedAt).toLocaleString()}</p>
                      {sub.text && <p className="text-xs text-[#4d6477] line-clamp-1 italic">"{sub.text}"</p>}
                      {sub.fileUrl && <div className="mt-2 text-[10px] text-[#0E8696] font-medium flex items-center gap-1"><Download className="w-3 h-3" /> File attached</div>}
                    </div>
                  ))
                )}
              </div>

              {/* Grading Panel */}
              <div className="w-full sm:w-1/2 p-6 bg-[#f4f8fb]/50 sm:overflow-y-auto">
                {gradingData.studentId ? (
                  <form onSubmit={handleGrade} className="space-y-6">
                    <h3 className="font-bold text-[#021F37] flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Grade Student
                    </h3>
                    
                    {/* Student Work Display */}
                    {(() => {
                      const sub = currentAssignmentSubmissions?.submissions?.find((s: any) => s.studentId._id === gradingData.studentId);
                      if (!sub) return null;
                      return (
                        <div className="bg-white border border-[#d5e0e8] rounded-xl p-4 mb-6 shadow-sm">
                          <p className="text-xs font-bold text-[#5f7587] uppercase tracking-widest mb-3">Student Submission</p>
                          {sub.text && (
                            <div className="mb-4">
                              <p className="text-sm text-[#021F37] whitespace-pre-wrap bg-[#f4f8fb] p-3 rounded-lg border border-slate-100">{sub.text}</p>
                            </div>
                          )}
                          {sub.fileUrl && (
                            <button 
                              onClick={() => handleFileDownload(sub.fileUrl, `submission_${sub.studentId?.name || 'student'}`)}
                              className="flex items-center gap-2 w-full justify-center py-2.5 bg-[#0b6f7c] text-white rounded-lg text-sm font-semibold hover:bg-[#021F37] transition-all shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download Submitted File
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-sm font-medium text-[#021F37] mb-1">Score (Out of {activeAssignment.maxMarks})</label>
                      <input type="number" required max={activeAssignment.maxMarks} value={gradingData.score} onChange={e => setGradingData({...gradingData, score: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#021F37] mb-1">Feedback for Student</label>
                      <textarea rows={4} value={gradingData.feedback} onChange={e => setGradingData({...gradingData, feedback: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none" placeholder="Provide constructive feedback..." />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 w-full py-3 bg-[#0b6f7c] text-sm font-bold text-white rounded-xl shadow-md hover:bg-[#021F37] disabled:opacity-50 transition-all">
                      {isSubmitting ? <><Loader size="sm" /> Saving...</> : 'Submit Grade & Feedback'}
                    </button>
                  </form>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#5f7587]">
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
              <h2 className="text-xl font-bold text-[#021F37]">Submit: {activeAssignment.title}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#5f7587] hover:text-[#4d6477]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#021F37] mb-1">Your Answer (Optional)</label>
                <textarea 
                  rows={4} 
                  value={submissionText} 
                  onChange={e => setSubmissionText(e.target.value)} 
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] outline-none"
                  placeholder="Type your answer or comments here..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#021F37] mb-1">Attach File (Optional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-[#f4f8fb]">
                  <UploadCloud className="w-8 h-8 text-[#5f7587] mb-2" />
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-[#4d6477]" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-[#4d6477] hover:text-[#021F37]">Cancel</button>
                <button type="submit" disabled={isSubmitting || (!submissionText && !file)} className="flex items-center gap-2 px-4 py-2 bg-[#0b6f7c] text-sm font-medium text-white rounded-lg shadow-sm hover:bg-[#021F37] disabled:opacity-50">
                  {isSubmitting ? <><Loader size="sm" /> Submitting...</> : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
