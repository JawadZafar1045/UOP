"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { CheckCircle, Plus, Play, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api'; // Needed for startQuiz which is not fully typed in store

export default function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { quizzes, isLoading, error, fetchQuizzes } = useLmsStore();
  const { user } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchQuizzes(courseId);
  }, [courseId, fetchQuizzes]);

  // Simplified Create Quiz handler (just closes for now, could be expanded)
  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Create quiz functionality to be fully implemented');
    setShowModal(false);
  };

  if (isLoading && quizzes.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading quizzes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/lms/courses/${courseId}`} className="text-sm text-blue-600 hover:underline mb-2 block">&larr; Back to Course</Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Quizzes</h1>
        </div>
        {isTeacherOrAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" />
            Create Quiz
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {quizzes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No quizzes available</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-slate-900 text-lg">{quiz.title}</h3>
                <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase border ${quiz.status === 'published' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700 bg-slate-100 border-slate-200'}`}>
                  {quiz.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-6 flex-1">{quiz.instructions || 'No instructions'}</p>
              
              <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center gap-4">
                  {quiz.timeLimit && (
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {quiz.timeLimit} mins</span>
                  )}
                  <span>Pass: {quiz.passMark}%</span>
                </div>
                
                {isTeacherOrAdmin ? (
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Manage Quiz
                  </button>
                ) : (
                  <button 
                    disabled={quiz.status !== 'published'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${quiz.status === 'published' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <Play className="w-4 h-4" />
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Basic Create Quiz Modal for Teachers */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Create Quiz Settings</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateQuiz} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                <input required type="text" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. Midterm Assessment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (mins)</label>
                  <input type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Leave empty for unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pass Mark (%)</label>
                  <input type="number" defaultValue={60} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  Save & Add Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
