"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import {
  CheckCircle, Plus, Play, XCircle, Clock, Users, FileText,
  Eye, Settings, BarChart3, Edit, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Award, CheckCircle2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import * as lmsService from '@/services/lms.service';

interface QuizResult {
  studentId: any;
  studentName: string;
  percentScore: number;
  passed: boolean;
  timeTakenSeconds: number;
  attemptNumber: number;
  submittedAt: string;
}

export default function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { quizzes, isLoading, error, fetchQuizzes } = useLmsStore();
  const { user } = useStore();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [editQuizId, setEditQuizId] = useState<string | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const { updateQuiz } = useLmsStore();

  // Data states
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  // Quiz player states
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);
  const [quizPlayerPhase, setQuizPlayerPhase] = useState<'landing' | 'playing' | 'result'>('landing');
  const [quizPlayerQuiz, setQuizPlayerQuiz] = useState<any>(null);
  const [quizPlayerQuestions, setQuizPlayerQuestions] = useState<any[]>([]);
  const [quizPlayerAnswers, setQuizPlayerAnswers] = useState<{questionId: string, selectedIndex: number}[]>([]);
  const [quizPlayerIndex, setQuizPlayerIndex] = useState(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    instructions: '',
    timeLimit: '',
    passMark: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    showResultImmediately: true
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctIndex: 0,
    explanation: '',
    marks: 1
  });

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchQuizzes(courseId);
  }, [courseId, fetchQuizzes]);

  // Countdown timer
  useEffect(() => {
    if (quizPlayerPhase !== 'playing' || quizTimeLeft === null || quizTimeLeft <= 0) return;
    const timer = setTimeout(() => setQuizTimeLeft(t => (t ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [quizTimeLeft, quizPlayerPhase]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (quizPlayerPhase === 'playing' && quizTimeLeft === 0 && quizPlayerQuiz) {
      lmsService.submitQuiz(quizPlayerQuiz._id, quizPlayerAnswers.filter(a => a.selectedIndex >= 0))
        .then(res => {
          const result = res?.data ?? res;
          setQuizResult(result);
          setQuizPlayerPhase('result');
          setQuizTimeLeft(null);
          fetchQuizzes(courseId);
        })
        .catch(console.error);
    }
  }, [quizTimeLeft]);

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...createForm,
        timeLimit: createForm.timeLimit ? parseInt(createForm.timeLimit) : null,
        passMark: Number(createForm.passMark),
        maxAttempts: Number(createForm.maxAttempts),
        shuffleQuestions: createForm.shuffleQuestions,
        showResultImmediately: createForm.showResultImmediately
      };

      if (isEditingQuiz && editQuizId) {
        await updateQuiz(editQuizId, data);
        setShowCreateModal(false);
      } else {
        const newQuiz = await lmsService.createQuiz(courseId, data);
        setShowCreateModal(false);
        // Auto-open question builder for the new quiz
        setCurrentQuiz(newQuiz);
        setShowQuestionBuilder(true);
      }
      
      setCreateForm({
        title: '',
        instructions: '',
        timeLimit: '',
        passMark: 60,
        maxAttempts: 1,
        shuffleQuestions: false,
        showResultImmediately: true
      });
      fetchQuizzes(courseId);
      setIsEditingQuiz(false);
      setEditQuizId(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to save quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditQuizModal = (quiz: any) => {
    setIsEditingQuiz(true);
    setEditQuizId(quiz._id);
    setCreateForm({
      title: quiz.title,
      instructions: quiz.instructions || '',
      timeLimit: quiz.timeLimit ? String(quiz.timeLimit) : '',
      passMark: quiz.passMark || 60,
      maxAttempts: quiz.maxAttempts || 1,
      shuffleQuestions: !!quiz.shuffleQuestions,
      showResultImmediately: !!quiz.showResultImmediately
    });
    setShowCreateModal(true);
  };

  const openCreateQuizModal = () => {
    setIsEditingQuiz(false);
    setEditQuizId(null);
    setCreateForm({
      title: '',
      instructions: '',
      timeLimit: '',
      passMark: 60,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResultImmediately: true
    });
    setShowCreateModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz) return;

    setIsSubmitting(true);
    try {
      const data = {
        question: questionForm.question,
        options: [
          questionForm.optionA,
          questionForm.optionB,
          questionForm.optionC,
          questionForm.optionD
        ],
        correctIndex: questionForm.correctIndex,
        explanation: questionForm.explanation,
        marks: questionForm.marks
      };

      if (isEditingQuestion && editQuestionId) {
        await lmsService.updateQuizQuestion(editQuestionId, data);
        alert('Question updated successfully!');
      } else {
        await lmsService.addQuizQuestion(currentQuiz._id, data);
        alert('Question added successfully!');
      }

      setQuestionForm({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctIndex: 0,
        explanation: '',
        marks: 1
      });
      setIsEditingQuestion(false);
      setEditQuestionId(null);
      // Refresh question list logic here if needed
    } catch (err: any) {
      alert(err?.message || 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditQuestion = (q: any) => {
    setIsEditingQuestion(true);
    setEditQuestionId(q._id);
    setQuestionForm({
      question: q.question,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      correctIndex: q.correctIndex,
      explanation: q.explanation || '',
      marks: q.marks || 1
    });
  };

  // Publish Quiz Handler
  const handlePublishQuiz = async (quizId: string) => {
    if (!confirm('Publish this quiz? Students will be able to take it.')) return;

    try {
      await lmsService.publishQuiz(quizId);
      fetchQuizzes(courseId);
    } catch (err: any) {
      alert(err?.message || 'Failed to publish quiz');
    }
  };

  // View Results Handler
  const handleViewResults = async (quiz: any) => {
    setCurrentQuiz(quiz);
    try {
      const results = await lmsService.getQuizResults(quiz._id);
      setQuizResults(results);
      setShowResults(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to load results');
    }
  };

  // Quiz Player Handlers
  const handleStartQuiz = (quiz: any) => {
    setQuizPlayerQuiz(quiz);
    setQuizPlayerPhase('landing');
    setQuizResult(null);
    setQuizPlayerAnswers([]);
    setQuizPlayerIndex(0);
    setQuizTimeLeft(null);
    setShowQuizPlayer(true);
  };

  const handleBeginAttempt = async () => {
    if (!quizPlayerQuiz) return;
    setIsSubmitting(true);
    try {
      const res = await lmsService.startQuiz(quizPlayerQuiz._id);
      // API interceptor returns response.data (the full JSON), so unwrap .data
      const payload = res?.data ?? res;
      const questions = payload.questions || [];
      setQuizPlayerQuestions(questions);
      setQuizPlayerAnswers(questions.map((q: any) => ({ questionId: q._id, selectedIndex: -1 })));
      setQuizPlayerIndex(0);
      if (quizPlayerQuiz.timeLimit) setQuizTimeLeft(quizPlayerQuiz.timeLimit * 60);
      setQuizPlayerPhase('playing');
    } catch (err: any) {
      alert(err?.message || err?.error || 'No attempts remaining or quiz unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setQuizPlayerAnswers(prev => prev.map((a, i) => i === quizPlayerIndex ? { ...a, selectedIndex: optionIndex } : a));
  };

  const handleSubmitQuiz = async () => {
    if (!quizPlayerQuiz) return;
    if (!confirm('Submit your quiz? You cannot change answers after submitting.')) return;
    setIsSubmitting(true);
    try {
      const res = await lmsService.submitQuiz(quizPlayerQuiz._id, quizPlayerAnswers.filter(a => a.selectedIndex >= 0));
      const result = res?.data ?? res;
      setQuizResult(result);
      setQuizPlayerPhase('result');
      setQuizTimeLeft(null);
      fetchQuizzes(courseId);
    } catch (err: any) {
      alert(err?.message || err?.error || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && quizzes.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading quizzes...</div>;
  }

  if (isLoading && quizzes.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading quizzes...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/lms/courses/${courseId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all group active:scale-[0.98] shadow-blue-500/20">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to Course
          </Link>
          
          {isTeacherOrAdmin && (
            <button
              onClick={openCreateQuizModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-[0.98] shadow-blue-500/20"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Quiz
            </button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quizzes</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">Assessment and evaluation management for students.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/50 text-red-600 rounded-xl border border-red-100 backdrop-blur-sm">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No quizzes available</h3>
          <p className="text-slate-500 text-base max-w-sm leading-relaxed">
            Assess student knowledge by creating your first quiz for this course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="bg-white rounded-2xl border border-slate-200/60 hover:border-blue-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col group p-7 relative">
              {/* Status Badge */}
              <div className="absolute top-7 right-7">
                <span className={`text-[10px] font-bold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase border ${
                  quiz.status === 'published' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                  quiz.status === 'closed' ? 'text-slate-600 bg-slate-50 border-slate-100' :
                  'text-amber-700 bg-amber-50 border-amber-100'
                }`}>
                  {quiz.status}
                </span>
              </div>

              <div className="mb-5">
                <h3 className="font-bold text-slate-900 text-xl leading-snug mb-3 group-hover:text-blue-600 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-[15px] text-slate-500 line-clamp-2 leading-relaxed">
                  {quiz.instructions || 'Test your knowledge with this comprehensive assessment.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 mb-8">
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/60">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold">{quiz.questionCount || 0} Questions</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/60">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold">{quiz.timeLimit} mins</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/60">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold">Pass: {quiz.passMark}%</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                {isTeacherOrAdmin ? (
                  <div className="flex items-center gap-4">
                    {quiz.status === 'draft' && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentQuiz(quiz);
                            setShowQuestionBuilder(true);
                          }}
                          className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Questions
                        </button>
                        <button
                          onClick={() => openEditQuizModal(quiz)}
                          className="text-sm font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        {(quiz.questionCount || 0) > 0 && (
                          <button
                            onClick={() => handlePublishQuiz(quiz._id)}
                            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Publish
                          </button>
                        )}
                      </>
                    )}
                    {(quiz.status === 'published' || quiz.status === 'closed') && (
                      <button
                        onClick={() => handleViewResults(quiz)}
                        className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Results
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      disabled={quiz.status !== 'published' || ((quiz.myAttempts || 0) >= (quiz.maxAttempts || 1))}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.98] ${
                        quiz.status === 'published' && ((quiz.myAttempts || 0) < (quiz.maxAttempts || 1))
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      {(quiz.myAttempts || 0) > 0 ? 'Retake Quiz' : 'Start Quiz'}
                    </button>
                    
                    {((quiz.myAttempts || 0) > 0 || quiz.bestScore !== null) && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await lmsService.getMyAttempts(quiz._id);
                            const payload = res?.data ?? res;
                            if (payload && payload.length > 0) {
                              setQuizResult(payload[0]); 
                              setQuizPlayerQuiz(quiz);
                              setQuizPlayerPhase('result');
                              setShowQuizPlayer(true);
                            }
                          } catch (e) {
                            alert('Failed to load your results');
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                        Result
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{isEditingQuiz ? 'Edit Quiz Settings' : 'Create New Quiz'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveQuiz} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title *</label>
                <input
                  required
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="e.g. Midterm Assessment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                <textarea
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm({...createForm, instructions: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="Optional instructions for students..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={createForm.timeLimit}
                    onChange={(e) => setCreateForm({...createForm, timeLimit: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="0 = no limit"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pass Mark (%)</label>
                  <input
                    type="number"
                    value={createForm.passMark}
                    onChange={(e) => setCreateForm({...createForm, passMark: parseInt(e.target.value) || 60})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                <input
                  type="number"
                  value={createForm.maxAttempts}
                  onChange={(e) => setCreateForm({...createForm, maxAttempts: parseInt(e.target.value) || 1})}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Shuffle Questions</label>
                  <button
                    type="button"
                    onClick={() => setCreateForm({...createForm, shuffleQuestions: !createForm.shuffleQuestions})}
                    className="flex items-center"
                  >
                    {createForm.shuffleQuestions ? (
                      <ToggleRight className="w-10 h-6 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Show Results Immediately</label>
                  <button
                    type="button"
                    onClick={() => setCreateForm({...createForm, showResultImmediately: !createForm.showResultImmediately})}
                    className="flex items-center"
                  >
                    {createForm.showResultImmediately ? (
                      <ToggleRight className="w-10 h-6 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (isEditingQuiz ? 'Update Quiz' : 'Create Quiz')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Builder Modal */}
      {showQuestionBuilder && currentQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] shadow-xl overflow-hidden flex">
            {/* Left Side - Questions List */}
            <div className="w-1/3 border-r border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
                <span className="text-sm text-slate-500">{quizQuestions.length} added</span>
              </div>

              <div className="space-y-3 max-h-[calc(90vh-200px)] overflow-y-auto">
                {quizQuestions.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No questions added yet</p>
                  </div>
                ) : (
                  quizQuestions.map((q, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg group/q relative border border-slate-100 hover:border-blue-200 transition-all">
                      <p className="text-sm font-medium text-slate-900 pr-8">Q{index + 1}: {q.question}</p>
                      <p className="text-xs text-slate-500 mt-1">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                      <button 
                        onClick={() => openEditQuestion(q)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-blue-600 opacity-0 group-hover/q:opacity-100 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowQuestionBuilder(false);
                    setCurrentQuiz(null);
                    fetchQuizzes(courseId);
                  }}
                  className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                >
                  Done Adding Questions
                </button>
              </div>
            </div>

            {/* Right Side - Add Question Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">{isEditingQuestion ? 'Edit Question' : 'Add Question'}</h3>
                <div className="flex gap-2">
                  {isEditingQuestion && (
                    <button 
                      onClick={() => {
                        setIsEditingQuestion(false);
                        setEditQuestionId(null);
                        setQuestionForm({
                          question: '', optionA: '', optionB: '', optionC: '', optionD: '',
                          correctIndex: 0, explanation: '', marks: 1
                        });
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1 rounded-md"
                    >
                      New Question
                    </button>
                  )}
                  <button onClick={() => setShowQuestionBuilder(false)} className="text-slate-400 hover:text-slate-600">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Question *</label>
                  <textarea
                    required
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="Enter your question here..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Option A *</label>
                    <input
                      required
                      type="text"
                      value={questionForm.optionA}
                      onChange={(e) => setQuestionForm({...questionForm, optionA: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="First option"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Option B *</label>
                    <input
                      required
                      type="text"
                      value={questionForm.optionB}
                      onChange={(e) => setQuestionForm({...questionForm, optionB: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Second option"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Option C *</label>
                    <input
                      required
                      type="text"
                      value={questionForm.optionC}
                      onChange={(e) => setQuestionForm({...questionForm, optionC: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Third option"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Option D *</label>
                    <input
                      required
                      type="text"
                      value={questionForm.optionD}
                      onChange={(e) => setQuestionForm({...questionForm, optionD: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Fourth option"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer *</label>
                  <div className="space-y-2">
                    {[
                      { label: 'A', value: 0 },
                      { label: 'B', value: 1 },
                      { label: 'C', value: 2 },
                      { label: 'D', value: 3 }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="correctAnswer"
                          value={option.value}
                          checked={questionForm.correctIndex === option.value}
                          onChange={(e) => setQuestionForm({...questionForm, correctIndex: parseInt(e.target.value)})}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="Optional explanation shown after attempt..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({...questionForm, marks: parseInt(e.target.value) || 1})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    min="1"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (isEditingQuestion ? 'Update Question' : 'Add Question')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && currentQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Quiz Results: {currentQuiz.title}</h2>
                <p className="text-sm text-slate-500 mt-1">Student performance overview</p>
              </div>
              <button onClick={() => setShowResults(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {quizResults.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No results yet</p>
                  <p className="text-sm">Students haven't taken this quiz yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Student</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Score</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Passed</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Time Taken</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Attempt</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizResults.map((result, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{result.studentId?.name || 'Unknown Student'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-semibold ${result.percentScore >= currentQuiz.passMark ? 'text-emerald-600' : 'text-red-600'}`}>
                              {result.percentScore}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {result.passed ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {Math.floor(result.timeTakenSeconds / 60)}:{(result.timeTakenSeconds % 60).toString().padStart(2, '0')}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">#{result.attemptNumber}</td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Quiz Player Modal ── */}
      {showQuizPlayer && quizPlayerQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* LANDING */}
            {quizPlayerPhase === 'landing' && (
              <>
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Ready to begin?</p>
                    <h2 className="text-xl font-bold">{quizPlayerQuiz.title}</h2>
                  </div>
                  <button onClick={() => setShowQuizPlayer(false)} className="text-white/70 hover:text-white mt-1"><XCircle className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-5">
                  {quizPlayerQuiz.instructions && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Instructions</p>
                      <p className="text-sm text-blue-800">{quizPlayerQuiz.instructions}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{label:'Questions', val: quizPlayerQuiz.questionCount || '?'},{label:'Time Limit', val: quizPlayerQuiz.timeLimit ? `${quizPlayerQuiz.timeLimit} min` : 'None'},{label:'Pass Mark', val:`${quizPlayerQuiz.passMark}%`},{label:'Max Attempts', val: quizPlayerQuiz.maxAttempts}].map(s=>(
                      <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <p className="text-xl font-bold text-slate-900">{s.val}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">Once you start, the timer will begin (if applicable). Make sure you have enough time before proceeding.</p>
                  </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setShowQuizPlayer(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                  <button onClick={handleBeginAttempt} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 shadow-md transition-all">
                    <Play className="w-4 h-4" />{isSubmitting ? 'Starting...' : 'Begin Attempt'}
                  </button>
                </div>
              </>
            )}

            {/* PLAYING */}
            {quizPlayerPhase === 'playing' && quizPlayerQuestions.length > 0 && (() => {
              const q = quizPlayerQuestions[quizPlayerIndex];
              const currentAnswer = quizPlayerAnswers[quizPlayerIndex]?.selectedIndex ?? -1;
              const answered = quizPlayerAnswers.filter(a => a.selectedIndex >= 0).length;
              return (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-sm font-semibold text-slate-700">Question {quizPlayerIndex + 1} of {quizPlayerQuestions.length}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">{answered}/{quizPlayerQuestions.length} answered</span>
                      {quizTimeLeft !== null && (
                        <span className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-lg ${quizTimeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(quizTimeLeft/60)}:{String(quizTimeLeft%60).padStart(2,'0')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5">
                    <div className="bg-blue-500 h-1.5 transition-all" style={{width:`${((quizPlayerIndex+1)/quizPlayerQuestions.length)*100}%`}} />
                  </div>
                  {/* Question */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    <p className="text-base font-semibold text-slate-900 leading-relaxed">{q.question}</p>
                    <div className="space-y-3">
                      {(q.options || []).map((opt: string, idx: number) => (
                        <button key={idx} onClick={() => handleSelectAnswer(idx)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            currentAnswer === idx
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${ currentAnswer === idx ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{['A','B','C','D'][idx]}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Navigation */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={() => setQuizPlayerIndex(i => Math.max(0, i-1))} disabled={quizPlayerIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <div className="flex gap-1">
                      {quizPlayerQuestions.map((_,i) => (
                        <button key={i} onClick={() => setQuizPlayerIndex(i)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                            i === quizPlayerIndex ? 'bg-blue-600 text-white' :
                            quizPlayerAnswers[i]?.selectedIndex >= 0 ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>{i+1}</button>
                      ))}
                    </div>
                    {quizPlayerIndex < quizPlayerQuestions.length - 1 ? (
                      <button onClick={() => setQuizPlayerIndex(i => i+1)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={handleSubmitQuiz} disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-60 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />{isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                      </button>
                    )}
                  </div>
                </>
              );
            })()}

            {/* RESULT */}
            {quizPlayerPhase === 'result' && quizResult && (
              <>
                <div className={`p-8 text-center ${ quizResult.passed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    {quizResult.passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                  </div>
                  <p className="text-5xl font-black mb-1">{quizResult.score ?? quizResult.percentScore}%</p>
                  <p className="text-lg font-bold opacity-90">{quizResult.passed ? '🎉 Passed!' : 'Not Passed'}</p>
                  <p className="text-sm opacity-75 mt-1">{quizResult.totalMarks} / {quizResult.maxMarks} marks</p>
                </div>
                <div className="overflow-y-auto p-5 space-y-3 flex-1">
                  {(() => {
                    const breakdown = quizResult.breakdown || quizResult.answers;
                    if (breakdown && breakdown.length > 0) {
                      return (
                        <>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Question Breakdown</p>
                          {breakdown.map((item: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-xl border ${ item.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-slate-800 flex-1">{item.question || `Question ${idx + 1}`}</p>
                                {item.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                              </div>
                              {(!item.isCorrect || true) && item.explanation && (
                                <p className="text-xs text-slate-600 mt-2 italic">💡 {item.explanation}</p>
                              )}
                            </div>
                          ))}
                        </>
                      );
                    }
                    return (
                      <div className="text-center text-slate-500 py-6 text-sm">Detailed breakdown not available for this quiz.</div>
                    );
                  })()}
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowQuizPlayer(false)} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
