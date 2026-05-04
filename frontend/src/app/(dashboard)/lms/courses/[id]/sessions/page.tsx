"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Calendar, Plus, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api'; // Assuming you have api exported, or I'll just use the service directly.
import * as lmsService from '@/services/lms.service';

export default function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { sessions, isLoading, error, fetchSessions, createSession, toggleSession, markPresent } = useLmsStore();
  const { user } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', attendanceCloseAt: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<{ total: number, present: number, percentage: number } | null>(null);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchSessions(courseId);
    if (!isTeacherOrAdmin) {
      lmsService.getMyAttendanceSummary(courseId)
        .then(res => setAttendanceSummary(res))
        .catch(console.error);
    }
  }, [courseId, fetchSessions, isTeacherOrAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSession(courseId, formData);
      setShowModal(false);
      setFormData({ title: '', date: '', attendanceCloseAt: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (sessionId: string) => {
    await toggleSession(sessionId);
  };

  const handleMarkPresent = async (sessionId: string) => {
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
    }
  };

  if (isLoading && sessions.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/lms/courses/${courseId}`} className="text-sm text-blue-600 hover:underline mb-2 block">&larr; Back to Course</Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Course Sessions</h1>
        </div>
        {isTeacherOrAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {!isTeacherOrAdmin && attendanceSummary && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-indigo-900 font-semibold mb-1">My Attendance Summary</h3>
            <p className="text-indigo-700 text-sm">You have attended {attendanceSummary.present} out of {attendanceSummary.total} sessions.</p>
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {attendanceSummary.percentage}%
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${session.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {session.isOpen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {session.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isTeacherOrAdmin ? (
                      <button onClick={() => handleToggle(session._id)} className="text-blue-600 hover:text-blue-800 font-medium">
                        {session.isOpen ? 'Close Attendance' : 'Open Attendance'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleMarkPresent(session._id)}
                        disabled={!session.isOpen}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all ${session.isOpen ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        {session.isOpen ? 'Mark Present' : 'Closed'}
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
              <h2 className="text-xl font-bold text-slate-900">Create Session</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
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
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
