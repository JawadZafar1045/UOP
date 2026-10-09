"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Calendar, Plus, CheckCircle2, XCircle, Clock, Users, Download, FileText, ChevronLeft, PieChart as PieIcon, Edit2 } from 'lucide-react';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';
import api from '@/services/api'; // Assuming you have api exported, or I'll just use the service directly.
import * as lmsService from '@/services/lms.service';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);

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
  const [isToggling, setIsToggling] = useState<string | null>(null);
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
    setIsToggling(sessionId);
    try {
      await toggleSession(sessionId);
    } finally {
      setIsToggling(null);
    }
  };

  const handleMarkPresent = async (sessionId: string) => {
    setIsMarking(sessionId);
    try {
      await markPresent(sessionId);
      alert('Successfully marked present!');
      // Refresh to update summary and session list
      if (!isTeacherOrAdmin) {
        fetchSessions(courseId);
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
    return <div className="p-8 flex justify-center"><Loader size="md" text="Loading sessions..." /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
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
              Create Session
            </button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[#021F37] tracking-tight">Course Sessions</h1>
          <p className="text-[#4d6477] mt-1.5 text-[15px]">Manage and track attendance for your course lectures.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {!isTeacherOrAdmin && attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#f4f8fb] border border-[#eaf3f7] rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-[#eaf3f7]/50 rounded-2xl text-[#0E8696]">
                <PieIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[#021F37] font-bold text-xl mb-1">My Attendance Summary</h3>
                <p className="text-[#0b6f7c]/80 font-medium text-sm sm:text-base">You have attended <span className="text-[#021F37] font-bold">{attendanceSummary.present}</span> out of <span className="text-[#021F37] font-bold">{attendanceSummary.total}</span> sessions.</p>
                <div className="mt-4 flex gap-3">
                  <span className="px-3 py-1 bg-white/60 rounded-full text-[10px] font-bold text-[#0E8696] border border-[#eaf3f7] uppercase tracking-wider">
                    Target: 75%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${attendanceSummary.percentage >= 75 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {attendanceSummary.percentage >= 75 ? 'On Track' : 'Below Target'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative w-32 h-32 mt-6 sm:mt-0">
              {attendanceSummary.total === 0 ? (
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-[#5f7587] leading-none">—</span>
                  <span className="text-[9px] font-bold text-[#5f7587] uppercase tracking-tighter mt-1">No data</span>
                </div>
              ) : (
                <>
                  <Doughnut data={attDoughnutData} options={attDoughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-1">
                    <span className="text-xl font-bold text-[#021F37] leading-none">{attendanceSummary.percentage}%</span>
                    <span className="text-[9px] font-bold text-[#0b4a66] uppercase tracking-tighter mt-1">Attended</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-white border border-[#d5e0e8] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-[#f4f8fb] text-[#0E8696] rounded-2xl mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#021F37] mb-1">Next Session</h4>
            <p className="text-[#4d6477] text-sm font-medium">No upcoming sessions scheduled.</p>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white border border-[#d5e0e8] rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-[#5f7587] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#021F37]">No sessions yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#d5e0e8] overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f4f8fb] text-[#4d6477] border-b border-[#d5e0e8]">
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
                <tr key={session._id} className="hover:bg-[#f4f8fb] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#021F37]">{session.title}</td>
                  <td className="px-6 py-4 text-[#4d6477]">
                    {new Date(session.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {session.materials && session.materials.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {session.materials.map((m: any, idx: number) => (
                          <a key={idx} href={getDownloadUrl(m.url)} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 text-sm text-[#0E8696] hover:text-[#021F37]">
                            <Download className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]" title={m.name}>{m.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : session.materialUrl ? (
                      <a href={getDownloadUrl(session.materialUrl)} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 text-sm text-[#0E8696] hover:text-[#021F37]">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-sm text-[#5f7587]">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${session.isOpen ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-[#021F37] border border-[#d5e0e8]'}`}>
                      {session.isOpen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {session.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isTeacherOrAdmin ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(session)} className="p-1.5 text-[#5f7587] hover:text-[#0E8696] hover:bg-[#f4f8fb] rounded-lg transition-all" title="Edit Session">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(session._id)}
                            disabled={isToggling === session._id}
                            className="flex items-center gap-1 text-[#0E8696] hover:text-[#021F37] font-medium text-xs disabled:opacity-50"
                          >
                            {isToggling === session._id
                              ? <><Loader size="sm" /> Updating...</>
                              : session.isOpen ? 'Close Attendance' : 'Open Attendance'}
                          </button>
                        </div>
                        <button onClick={() => handleViewAttendance(session._id, session.title)} className="text-green-600 hover:text-green-800 font-medium text-[11px] flex items-center gap-1">
                          <Users className="w-3 h-3" /> View List
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleMarkPresent(session._id)}
                        disabled={!session.isOpen || session.isAttended || isMarking === session._id}
                        className={`px-3 py-1.5 rounded-md font-medium border transition-all ${
                          session.isAttended
                            ? 'bg-slate-100 text-[#5f7587] border-[#d5e0e8] cursor-not-allowed'
                            : session.isOpen 
                              ? 'bg-green-600 text-white border-transparent hover:bg-green-700'
                              : 'bg-slate-100 text-[#5f7587] border-[#d5e0e8] cursor-not-allowed'
                        }`}
                      >
                        {isMarking === session._id
                          ? <span className="flex items-center gap-1"><Loader size="sm" /> Marking...</span>
                          : session.isAttended
                            ? 'Present'
                            : session.isOpen
                              ? 'Mark Present'
                              : 'Closed'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#021F37]">{isEditing ? 'Edit Session' : 'Create Session'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#5f7587] hover:text-[#4d6477]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#021F37] mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] focus:border-transparent outline-none" placeholder="e.g. Lecture 1: Intro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#021F37] mb-1">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#021F37] mb-1">Attendance Close At (Optional)</label>
                <input type="datetime-local" value={formData.attendanceCloseAt} onChange={e => setFormData({...formData, attendanceCloseAt: e.target.value})} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#021F37] mb-1">Session Materials (Optional)</label>
                <input type="file" multiple onChange={e => setMaterialFiles(Array.from(e.target.files || []))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E8696] focus:border-transparent outline-none bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f4f8fb] file:text-[#0b6f7c] hover:file:bg-[#eaf3f7]" />
                <p className="text-xs text-[#4d6477] mt-1">Upload multiple PDFs, documents, or videos (max 20MB total).</p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-[#4d6477] hover:text-[#021F37]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-[#0b6f7c] text-sm font-medium text-white rounded-lg shadow-sm hover:bg-[#021F37] disabled:opacity-50">
                  {isSubmitting ? <><Loader size="sm" />{isEditing ? 'Updating...' : 'Creating...'}</> : (isEditing ? 'Update Session' : 'Create Session')}
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
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#f4f8fb]/50">
              <div>
                <h2 className="text-lg font-bold text-[#021F37]">Attendance: {activeSessionName}</h2>
                <p className="text-xs text-[#4d6477]">{currentAttendanceList.length} Students Present</p>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="text-[#5f7587] hover:text-[#4d6477]">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {currentAttendanceList.length === 0 ? (
                <div className="text-center py-8 text-[#5f7587] text-sm">No attendance records found for this session.</div>
              ) : (
                <div className="space-y-2">
                  {currentAttendanceList.map((record, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#f4f8fb] border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-[#021F37]">{record.studentId?.name || 'Unknown Student'}</p>
                        <p className="text-[11px] text-[#4d6477]">{record.studentId?.email || ''}</p>
                      </div>
                      <span className="text-[10px] text-[#5f7587]">{new Date(record.markedAt || record.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-[#f4f8fb]/30 flex justify-end">
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
