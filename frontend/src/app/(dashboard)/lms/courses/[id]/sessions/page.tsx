"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Calendar, Plus, CheckCircle2, XCircle, Clock, Users, Download, FileText, ChevronLeft, PieChart as PieIcon, Edit2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api'; // Assuming you have api exported, or I'll just use the service directly.
import * as lmsService from '@/services/lms.service';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { sessions, isLoading, error, fetchSessions, createSession, toggleSession, markPresent } = useLmsStore();
  const { user } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', attendanceCloseAt: '' });
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarking, setIsMarking] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const { updateSession } = useLmsStore();
  const [attendanceSummary, setAttendanceSummary] = useState<{ total: number, present: number, percentage: number } | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentAttendanceList, setCurrentAttendanceList] = useState<any[]>([]);
  const [activeSessionName, setActiveSessionName] = useState('');

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const attDoughnutData = {
    datasets: [
      {
        data: [attendanceSummary?.present || 0, (attendanceSummary?.total || 0) - (attendanceSummary?.present || 0)],
        backgroundColor: ['#6366F1', '#E2E8F0'],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };

  const attDoughnutOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  useEffect(() => {
    fetchSessions(courseId);
    if (!isTeacherOrAdmin) {
      lmsService.getMyAttendanceSummary(courseId)
        .then(res => setAttendanceSummary(res))
        .catch(console.error);
    }
  }, [courseId, fetchSessions, isTeacherOrAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing && editSessionId) {
        // For editing, we use a simple object as we don't handle file updates yet in this modal for simplicity
        // or we could refactor to use FormData.
        await updateSession(editSessionId, {
          title: formData.title,
          date: formData.date,
          attendanceCloseAt: formData.attendanceCloseAt || null
        });
      } else {
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('date', formData.date);
        if (formData.attendanceCloseAt) {
          submitData.append('attendanceCloseAt', formData.attendanceCloseAt);
        }
        if (materialFiles && materialFiles.length > 0) {
          materialFiles.forEach(file => {
            submitData.append('materials', file);
          });
        }

        await createSession(courseId, submitData);
      }
      setShowModal(false);
      setFormData({ title: '', date: '', attendanceCloseAt: '' });
      setMaterialFiles([]);
      setIsEditing(false);
      setEditSessionId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (session: any) => {
    setIsEditing(true);
    setEditSessionId(session._id);
    setFormData({
      title: session.title,
      date: new Date(session.date).toISOString().split('T')[0],
      attendanceCloseAt: session.attendanceCloseAt ? new Date(session.attendanceCloseAt).toISOString().slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditSessionId(null);
    setFormData({ title: '', date: '', attendanceCloseAt: '' });
    setMaterialFiles([]);
    setShowModal(true);
  };

  const handleToggle = async (sessionId: string) => {
    await toggleSession(sessionId);
  };

  const handleMarkPresent = async (sessionId: string) => {
    setIsMarking(sessionId);
    try {
      await markPresent(sessionId);
      alert('Successfully marked present!');
      // Refresh to update summary
      if (!isTeacherOrAdmin) {
        lmsService.getMyAttendanceSummary(courseId)
          .then(res => setAttendanceSummary(res))
          .catch(console.error);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark attendance.');
    } finally {
      setIsMarking(null);
    }
  };
  
  const handleViewAttendance = async (sessionId: string, sessionTitle: string) => {
    try {
      const list = await lmsService.getSessionAttendance(sessionId);
      setCurrentAttendanceList(list);
      setActiveSessionName(sessionTitle);
      setShowAttendanceModal(true);
    } catch (err) {
      alert('Failed to load attendance list');
    }
  };

  const getDownloadUrl = (url: string) => {
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  if (isLoading && sessions.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading sessions...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/lms/courses/${courseId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all group active:scale-[0.98] shadow-blue-500/20">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to Course
          </Link>
          
          {isTeacherOrAdmin && (
            <button 
              onClick={openCreateModal} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-[0.98] shadow-blue-500/20"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Session
            </button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Course Sessions</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">Manage and track attendance for your course lectures.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {!isTeacherOrAdmin && attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-100/50 rounded-2xl text-indigo-600">
                <PieIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-indigo-900 font-bold text-xl mb-1">My Attendance Summary</h3>
                <p className="text-indigo-700/80 font-medium text-sm sm:text-base">You have attended <span className="text-indigo-900 font-bold">{attendanceSummary.present}</span> out of <span className="text-indigo-900 font-bold">{attendanceSummary.total}</span> sessions.</p>
                <div className="mt-4 flex gap-3">
                  <span className="px-3 py-1 bg-white/60 rounded-full text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                    Target: 75%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${attendanceSummary.percentage >= 75 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {attendanceSummary.percentage >= 75 ? 'On Track' : 'Below Target'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative w-32 h-32 mt-6 sm:mt-0">
              <Doughnut data={attDoughnutData} options={attDoughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-1">
                <span className="text-xl font-bold text-indigo-900 leading-none">{attendanceSummary.percentage}%</span>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter mt-1">Attended</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Next Session</h4>
            <p className="text-slate-500 text-sm font-medium">No upcoming sessions scheduled.</p>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No sessions yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Session Title</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Material</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{session.title}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(session.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {session.materials && session.materials.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {session.materials.map((m: any, idx: number) => (
                          <a key={idx} href={getDownloadUrl(m.url)} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
                            <Download className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]" title={m.name}>{m.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : session.materialUrl ? (
                      <a href={getDownloadUrl(session.materialUrl)} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${session.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {session.isOpen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {session.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isTeacherOrAdmin ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(session)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Session">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggle(session._id)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                            {session.isOpen ? 'Close Attendance' : 'Open Attendance'}
                          </button>
                        </div>
                        <button onClick={() => handleViewAttendance(session._id, session.title)} className="text-emerald-600 hover:text-emerald-800 font-medium text-[11px] flex items-center gap-1">
                          <Users className="w-3 h-3" /> View List
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleMarkPresent(session._id)}
                        disabled={!session.isOpen || isMarking === session._id}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all ${session.isOpen ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        {isMarking === session._id ? 'Marking...' : session.isOpen ? 'Mark Present' : 'Closed'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Session' : 'Create Session'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" placeholder="e.g. Lecture 1: Intro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attendance Close At (Optional)</label>
                <input type="datetime-local" value={formData.attendanceCloseAt} onChange={e => setFormData({...formData, attendanceCloseAt: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Session Materials (Optional)</label>
                <input type="file" multiple onChange={e => setMaterialFiles(Array.from(e.target.files || []))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <p className="text-xs text-slate-500 mt-1">Upload multiple PDFs, documents, or videos (max 20MB total).</p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Session' : 'Create Session')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Attendance List Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Attendance: {activeSessionName}</h2>
                <p className="text-xs text-slate-500">{currentAttendanceList.length} Students Present</p>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {currentAttendanceList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No attendance records found for this session.</div>
              ) : (
                <div className="space-y-2">
                  {currentAttendanceList.map((record, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{record.studentId?.name || 'Unknown Student'}</p>
                        <p className="text-[11px] text-slate-500">{record.studentId?.email || ''}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(record.markedAt || record.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-end">
              <button onClick={() => setShowAttendanceModal(false)} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
