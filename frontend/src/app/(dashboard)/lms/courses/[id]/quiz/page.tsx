"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import {
  CheckCircle, Plus, Play, XCircle, Clock, Users, FileText,
  Eye, Settings, BarChart3, Edit, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Award, CheckCircle2, AlertCircle, FileSpreadsheet,
  Volume2, VolumeX, HelpCircle, RotateCcw
} from 'lucide-react';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';
import * as lmsService from '@/services/lms.service';
import BulkQuizUploadModal from '@/components/lms/BulkQuizUploadModal';

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
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [editQuizId, setEditQuizId] = useState<string | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [publishingQuizId, setPublishingQuizId] = useState<string | null>(null);
  const [unpublishingQuizId, setUnpublishingQuizId] = useState<string | null>(null);
  const [loadingResultsId, setLoadingResultsId] = useState<string | null>(null);
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    instructions: '',
    timeLimit: '',
    passMark: 60,
    maxAttempts: 1,
    allowRetake: true,
    shuffleQuestions: false,
    showResultImmediately: true,
    enableNegativeMarking: false,
    correctMark: 1,
    negativeMark: 0.25,
    unattemptedMark: 0
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
        allowRetake: createForm.allowRetake !== false,
        shuffleQuestions: createForm.shuffleQuestions,
        showResultImmediately: createForm.showResultImmediately,
        enableNegativeMarking: !!createForm.enableNegativeMarking,
        correctMark: Number(createForm.correctMark) || 1,
        negativeMark: Number(createForm.negativeMark) || 0,
        unattemptedMark: Number(createForm.unattemptedMark) || 0
      };

      if (isEditingQuiz && editQuizId) {
        await updateQuiz(editQuizId, data);
        setShowCreateModal(false);
      } else {
        const newQuiz = await lmsService.createQuiz(courseId, data);
        setShowCreateModal(false);
        setCurrentQuiz(newQuiz);
        setQuizQuestions([]);
        setShowQuestionBuilder(true);
      }
      
      setCreateForm({
        title: '',
        instructions: '',
        timeLimit: '',
        passMark: 60,
        maxAttempts: 1,
        allowRetake: true,
        shuffleQuestions: false,
        showResultImmediately: true,
        enableNegativeMarking: false,
        correctMark: 1,
        negativeMark: 0.25,
        unattemptedMark: 0
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
      allowRetake: quiz.allowRetake !== false,
      shuffleQuestions: !!quiz.shuffleQuestions,
      showResultImmediately: !!quiz.showResultImmediately,
      enableNegativeMarking: !!quiz.enableNegativeMarking,
      correctMark: quiz.correctMark !== undefined ? quiz.correctMark : 1,
      negativeMark: quiz.negativeMark !== undefined ? quiz.negativeMark : 0.25,
      unattemptedMark: quiz.unattemptedMark !== undefined ? quiz.unattemptedMark : 0
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
      allowRetake: true,
      shuffleQuestions: false,
      showResultImmediately: true,
      enableNegativeMarking: false,
      correctMark: 1,
      negativeMark: 0.25,
      unattemptedMark: 0
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
      
      const updatedQuestions = await lmsService.getQuizQuestions(currentQuiz._id);
      setQuizQuestions(updatedQuestions || []);
      fetchQuizzes(courseId);
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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await lmsService.deleteQuizQuestion(questionId);
      if (currentQuiz) {
        const updatedQuestions = await lmsService.getQuizQuestions(currentQuiz._id);
        setQuizQuestions(updatedQuestions || []);
      }
      fetchQuizzes(courseId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete question');
    }
  };

  // Publish Quiz Handler
  const handlePublishQuiz = async (quizId: string) => {
    if (!confirm('Publish this quiz? Students will be able to take it.')) return;
    setPublishingQuizId(quizId);
    try {
      await lmsService.publishQuiz(quizId);
      fetchQuizzes(courseId);
    } catch (err: any) {
      alert(err?.message || 'Failed to publish quiz');
    } finally {
      setPublishingQuizId(null);
    }
  };

  // Unpublish Quiz Handler
  const handleUnpublishQuiz = async (quizId: string) => {
    if (!confirm('Revert this quiz to Draft? Students will no longer be able to take it, but their existing attempts will be preserved.')) return;
    setUnpublishingQuizId(quizId);
    try {
      await updateQuiz(quizId, { status: 'draft' });
      fetchQuizzes(courseId);
    } catch (err: any) {
      alert(err?.message || 'Failed to revert quiz');
    } finally {
      setUnpublishingQuizId(null);
    }
  };

  // View Results Handler
  const handleViewResults = async (quiz: any) => {
    setCurrentQuiz(quiz);
    setLoadingResultsId(quiz._id);
    try {
      const results = await lmsService.getQuizResults(quiz._id);
      setQuizResults(results);
      setShowResults(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to load results');
    } finally {
      setLoadingResultsId(null);
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

  // Stop text-to-speech when switching questions or closing quiz
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [quizPlayerIndex, showQuizPlayer, quizPlayerPhase]);

  const handleToggleReadQuestion = (question: any, index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech audio is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Compose formatted text for speech
    const optionsLabels = ['A', 'B', 'C', 'D'];
    const optionsText = (question?.options || [])
      .map((opt: string, idx: number) => `Option ${optionsLabels[idx] || idx + 1}: ${opt}`)
      .join('. ');

    const textToRead = `Question ${index + 1}: ${question?.question || ''}. ${optionsText}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setQuizPlayerAnswers(prev => prev.map((a, i) => i === quizPlayerIndex ? { ...a, selectedIndex: optionIndex } : a));
  };

  const handleSubmitQuiz = async () => {
    if (!quizPlayerQuiz) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setShowSubmitConfirm(false);
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
    return <div className="p-8 flex justify-center"><Loader size="md" text="Loading quizzes..." /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/lms/courses/${courseId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-700 transition-all group active:scale-[0.98] shadow-green-500/20">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to Course
          </Link>
          
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] shadow-emerald-600/20"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                Import from Excel
              </button>
              <button
                onClick={openCreateQuizModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-700 transition-all active:scale-[0.98] shadow-green-500/20"
              >
                <Plus className="w-4.5 h-4.5" />
                Create Quiz
              </button>
            </div>
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
            <div key={quiz._id} className="bg-white rounded-2xl border border-slate-200/60 hover:border-green-200/60 shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300 flex flex-col group p-7 relative">
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
                <h3 className="font-bold text-slate-900 text-xl leading-snug mb-3 group-hover:text-green-600 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-[15px] text-slate-500 line-clamp-2 leading-relaxed">
                  {quiz.instructions || 'Test your knowledge with this comprehensive assessment.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 mb-8">
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/60">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold">{quiz.questionCount || 0} Questions</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/60">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold">{quiz.timeLimit} mins</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/60">
                  <Award className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold">Pass: {quiz.passMark}%</span>
                </div>
                {quiz.enableNegativeMarking && (
                  <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-bold">PPSC: +{quiz.correctMark || 1} / -{quiz.negativeMark || 0.25}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                 {isTeacherOrAdmin ? (
                  <div className="flex items-center gap-4">
                    {quiz.status === 'draft' ? (
                      <>
                        <button
                          onClick={async () => {
                            setCurrentQuiz(quiz);
                            try {
                               const questions = await lmsService.getQuizQuestions(quiz._id);
                               setQuizQuestions(questions || []);
                            } catch (e) { console.error(e); }
                            setShowQuestionBuilder(true);
                          }}
                          className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1.5 transition-colors"
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
                            disabled={publishingQuizId === quiz._id}
                            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {publishingQuizId === quiz._id ? <><Loader size="sm" /> Publishing...</> : <><CheckCircle2 className="w-4 h-4" /> Publish</>}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUnpublishQuiz(quiz._id)}
                          disabled={unpublishingQuizId === quiz._id}
                          className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {unpublishingQuizId === quiz._id ? <><Loader size="sm" /> Reverting...</> : <><XCircle className="w-4 h-4" /> Revert to Draft</>}
                        </button>
                        {(quiz.status === 'published' || quiz.status === 'closed') && (
                          <button
                            onClick={() => handleViewResults(quiz)}
                            disabled={loadingResultsId === quiz._id}
                            className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {loadingResultsId === quiz._id ? <><Loader size="sm" /> Loading...</> : <><BarChart3 className="w-4 h-4" /> View Results</>}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    {(() => {
                      const isRetake = (quiz.myAttempts || 0) > 0;
                      const allowRetake = quiz.allowRetake !== false;
                      const canRetake = quiz.status === 'published' && (
                        allowRetake
                          ? (!quiz.maxAttempts || quiz.maxAttempts <= 1 || (quiz.myAttempts || 0) < quiz.maxAttempts)
                          : ((quiz.myAttempts || 0) < (quiz.maxAttempts || 1))
                      );

                      return (
                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          disabled={!canRetake}
                          className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-[0.98] ${
                            canRetake
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isRetake ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isRetake ? 'Retake Quiz' : 'Start Quiz'}
                        </button>
                      );
                    })()}
                    
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


      {/* Create / Edit Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm flex-shrink-0">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{isEditingQuiz ? 'Edit Quiz Settings' : 'Create New Quiz'}</h2>
                  <p className="text-xs text-slate-500">Configure quiz instructions, time limits, and scoring scheme</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form & Scrollable Body */}
            <form onSubmit={handleSaveQuiz} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Quiz Title *</label>
                  <input
                    required
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all"
                    placeholder="e.g. Midterm Assessment"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Instructions (Optional)</label>
                  <textarea
                    value={createForm.instructions}
                    onChange={(e) => setCreateForm({...createForm, instructions: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all resize-none"
                    placeholder="Optional instructions for students..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Time Limit (mins)</label>
                    <input
                      type="number"
                      value={createForm.timeLimit}
                      onChange={(e) => setCreateForm({...createForm, timeLimit: e.target.value})}
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                      placeholder="0 = Unlimited"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pass Mark (%)</label>
                    <input
                      type="number"
                      value={createForm.passMark}
                      onChange={(e) => setCreateForm({...createForm, passMark: parseInt(e.target.value) || 60})}
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Max Attempts {createForm.allowRetake ? '(1 or 0 for unlimited)' : '(Fixed: 1)'}
                    </label>
                    <input
                      type="number"
                      value={createForm.maxAttempts}
                      disabled={!createForm.allowRetake}
                      onChange={(e) => setCreateForm({...createForm, maxAttempts: parseInt(e.target.value) || 0})}
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-600 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Allow Quiz Retakes</p>
                      <p className="text-[11px] text-slate-500">Students can retake the quiz to improve their score</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateForm({...createForm, allowRetake: !createForm.allowRetake})}
                      className="flex items-center"
                    >
                      {createForm.allowRetake ? (
                        <ToggleRight className="w-8 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-5 text-slate-300" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Shuffle Questions</p>
                      <p className="text-[11px] text-slate-500">Randomize question order for each student attempt</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateForm({...createForm, shuffleQuestions: !createForm.shuffleQuestions})}
                      className="flex items-center"
                    >
                      {createForm.shuffleQuestions ? (
                        <ToggleRight className="w-8 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-5 text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Show Results Immediately</p>
                      <p className="text-[11px] text-slate-500">Display score and explanations right after submission</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateForm({...createForm, showResultImmediately: !createForm.showResultImmediately})}
                      className="flex items-center"
                    >
                      {createForm.showResultImmediately ? (
                        <ToggleRight className="w-8 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-5 text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* ── Negative Marking Configuration ── */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>PPSC-Style Negative Marking</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Competitive
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">Deduct marks for wrong answers (e.g. +1 / -0.25 scheme)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreateForm({...createForm, enableNegativeMarking: !createForm.enableNegativeMarking})}
                        className="flex items-center"
                      >
                        {createForm.enableNegativeMarking ? (
                          <ToggleRight className="w-8 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-5 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {createForm.enableNegativeMarking && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-amber-900 mb-1">Correct Mark (+)</label>
                            <input
                              type="number"
                              step="any"
                              value={createForm.correctMark}
                              onChange={(e) => setCreateForm({...createForm, correctMark: parseFloat(e.target.value) || 0})}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="1"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-amber-900 mb-1">Wrong Penalty (-)</label>
                            <input
                              type="number"
                              step="any"
                              value={createForm.negativeMark}
                              onChange={(e) => setCreateForm({...createForm, negativeMark: parseFloat(e.target.value) || 0})}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="0.25"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-amber-900 mb-1">Unattempted Mark</label>
                            <input
                              type="number"
                              step="any"
                              value={createForm.unattemptedMark}
                              onChange={(e) => setCreateForm({...createForm, unattemptedMark: parseFloat(e.target.value) || 0})}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] font-medium text-amber-800 bg-amber-100/70 p-2 rounded-lg flex items-center justify-between">
                          <span>Marking Scheme Formula:</span>
                          <span className="font-mono font-bold">
                            Score = (Correct × {createForm.correctMark || 1}) - (Wrong × {createForm.negativeMark || 0}) + (Unattempted × {createForm.unattemptedMark || 0})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createForm.title.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-green-500/20 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size="sm" />
                      {isEditingQuiz ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isEditingQuiz ? 'Update Quiz' : 'Create Quiz'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Builder Modal */}
      {showQuestionBuilder && currentQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[88vh] max-h-[760px] min-h-[500px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Left Side - Questions List */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50/50 flex-shrink-0 max-h-[35vh] md:max-h-full">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-green-600" />
                  <h3 className="text-sm font-bold text-slate-900">Questions</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                  {quizQuestions.length} added
                </span>
              </div>

              {/* Scrollable Questions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {quizQuestions.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold">No questions added yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use the form to add MCQs</p>
                  </div>
                ) : (
                  quizQuestions.map((q, index) => (
                    <div
                      key={q._id || index}
                      onClick={() => openEditQuestion(q)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                        editQuestionId === q._id
                          ? 'bg-green-50/80 border-green-300 shadow-sm'
                          : 'bg-white border-slate-200/70 hover:border-green-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 pr-12">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mt-0.5 flex-shrink-0">
                            Q{index + 1}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Option {['A', 'B', 'C', 'D'][q.correctIndex || 0]}
                        </span>
                        <span className="font-semibold">{q.marks || 1} mark{(q.marks || 1) !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Action buttons (hover or active) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditQuestion(q);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Edit Question"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q._id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Done Button */}
              <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionBuilder(false);
                    setCurrentQuiz(null);
                    fetchQuizzes(courseId);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-emerald-600/20 active:scale-[0.98]"
                >
                  Done Adding Questions ({quizQuestions.length})
                </button>
              </div>
            </div>

            {/* Right Side - Add/Edit Question Form */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {isEditingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  {isEditingQuestion && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Editing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditingQuestion && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingQuestion(false);
                        setEditQuestionId(null);
                        setQuestionForm({
                          question: '', optionA: '', optionB: '', optionC: '', optionD: '',
                          correctIndex: 0, explanation: '', marks: 1
                        });
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      + New Question
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowQuestionBuilder(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveQuestion} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Question Prompt *
                    </label>
                    <textarea
                      required
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all resize-none"
                      placeholder="Type your multiple-choice question here..."
                      rows={2}
                    />
                  </div>

                  {/* 4 Options Grid */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Options *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-extrabold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            A
                          </span>
                          <input
                            required
                            type="text"
                            value={questionForm.optionA}
                            onChange={(e) => setQuestionForm({...questionForm, optionA: e.target.value})}
                            className="w-full rounded-xl border border-slate-300 pl-11 pr-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                            placeholder="Option A text..."
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-extrabold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            B
                          </span>
                          <input
                            required
                            type="text"
                            value={questionForm.optionB}
                            onChange={(e) => setQuestionForm({...questionForm, optionB: e.target.value})}
                            className="w-full rounded-xl border border-slate-300 pl-11 pr-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                            placeholder="Option B text..."
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-extrabold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            C
                          </span>
                          <input
                            required
                            type="text"
                            value={questionForm.optionC}
                            onChange={(e) => setQuestionForm({...questionForm, optionC: e.target.value})}
                            className="w-full rounded-xl border border-slate-300 pl-11 pr-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                            placeholder="Option C text..."
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-extrabold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            D
                          </span>
                          <input
                            required
                            type="text"
                            value={questionForm.optionD}
                            onChange={(e) => setQuestionForm({...questionForm, optionD: e.target.value})}
                            className="w-full rounded-xl border border-slate-300 pl-11 pr-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                            placeholder="Option D text..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Correct Answer Selection Bar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Correct Answer *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Option A', value: 0 },
                        { label: 'Option B', value: 1 },
                        { label: 'Option C', value: 2 },
                        { label: 'Option D', value: 3 }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setQuestionForm({...questionForm, correctIndex: opt.value})}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            questionForm.correctIndex === opt.value
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {questionForm.correctIndex === opt.value && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Marks and Explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Marks
                      </label>
                      <input
                        type="number"
                        value={questionForm.marks}
                        onChange={(e) => setQuestionForm({...questionForm, marks: parseInt(e.target.value) || 1})}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                        min="1"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={questionForm.explanation}
                        onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none"
                        placeholder="Explanation shown to students after attempt..."
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    type="submit"
                    disabled={isSubmitting || !questionForm.question.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-green-500/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size="sm" />
                        {isEditingQuestion ? 'Updating...' : 'Adding Question...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {isEditingQuestion ? 'Update Question' : 'Save & Add Question'}
                      </>
                    )}
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
                        <th className="text-center py-3 px-4 font-semibold text-emerald-600">Correct</th>
                        <th className="text-center py-3 px-4 font-semibold text-rose-600">Wrong</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-500">Unattempted</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Score</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Passed</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Time Taken</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Attempt</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizResults.map((result: any, index: number) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{result.studentId?.name || 'Unknown Student'}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600">
                            {result.correctCount !== undefined ? result.correctCount : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600">
                            {result.wrongCount !== undefined ? result.wrongCount : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-500">
                            {result.unattemptedCount !== undefined ? result.unattemptedCount : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${result.percentScore >= currentQuiz.passMark ? 'text-emerald-600' : 'text-red-600'}`}>
                              {result.totalMarks !== undefined ? `${result.totalMarks}/${result.maxMarks || result.totalQuestions || 100} (${result.percentScore}%)` : `${result.percentScore}%`}
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
                            {Math.floor((result.timeTakenSeconds || 0) / 60)}:{((result.timeTakenSeconds || 0) % 60).toString().padStart(2, '0')}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">#{result.attemptNumber}</td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {new Date(result.submittedAt || result.createdAt).toLocaleDateString()}
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
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-green-600 to-indigo-600 text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-1">Ready to begin?</p>
                    <h2 className="text-xl font-bold">{quizPlayerQuiz.title}</h2>
                  </div>
                  <button onClick={() => setShowQuizPlayer(false)} className="text-white/70 hover:text-white mt-1"><XCircle className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-5">
                  {quizPlayerQuiz.instructions && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Instructions</p>
                      <p className="text-sm text-green-800">{quizPlayerQuiz.instructions}</p>
                    </div>
                  )}

                  {/* Negative Marking Alert */}
                  {quizPlayerQuiz.enableNegativeMarking && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>PPSC-Style Negative Marking Active</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                          <p className="font-bold text-emerald-700">+{quizPlayerQuiz.correctMark || 1}</p>
                          <p className="text-[10px] text-slate-500">Correct Answer</p>
                        </div>
                        <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                          <p className="font-bold text-rose-700">-{quizPlayerQuiz.negativeMark || 0.25}</p>
                          <p className="text-[10px] text-slate-500">Wrong Answer</p>
                        </div>
                        <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                          <p className="font-bold text-slate-700">{quizPlayerQuiz.unattemptedMark || 0}</p>
                          <p className="text-[10px] text-slate-500">Unattempted</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800 italic pt-1">
                        💡 Tip: You can clear your selected answer anytime during the quiz to leave a question unattempted and avoid negative marking penalties.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{
                      label:'Questions', 
                      val: quizPlayerQuiz.questionCount || '?'
                    },{
                      label:'Time Limit', 
                      val: quizPlayerQuiz.timeLimit ? `${quizPlayerQuiz.timeLimit} min` : 'None'
                    },{
                      label:'Pass Mark', 
                      val:`${quizPlayerQuiz.passMark}%`
                    },{
                      label:'Max Attempts', 
                      val: quizPlayerQuiz.allowRetake === false 
                        ? (quizPlayerQuiz.maxAttempts || 1) 
                        : (quizPlayerQuiz.maxAttempts > 1 ? quizPlayerQuiz.maxAttempts : 'Unlimited')
                    }].map(s=>(
                      <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <p className="text-xl font-bold text-slate-900">{s.val}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700">Once you start, the timer will begin. Make sure you have enough time before proceeding.</p>
                  </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setShowQuizPlayer(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                  <button onClick={handleBeginAttempt} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-60 shadow-md transition-all">
                    {isSubmitting ? <><Loader size="sm" /> Starting...</> : <><Play className="w-4 h-4" /> Begin Attempt</>}
                  </button>
                </div>
              </>
            )}

            {/* PLAYING */}
            {quizPlayerPhase === 'playing' && quizPlayerQuestions.length > 0 && (() => {
              const q = quizPlayerQuestions[quizPlayerIndex];
              const currentAnswer = quizPlayerAnswers[quizPlayerIndex]?.selectedIndex ?? -1;
              const answered = quizPlayerAnswers.filter(a => a.selectedIndex >= 0).length;
              const unattempted = quizPlayerQuestions.length - answered;
              return (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 gap-3">
                    <div>
                      <span className="text-sm font-bold text-slate-800">
                        Question {quizPlayerIndex + 1} of {quizPlayerQuestions.length}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="text-emerald-700 font-semibold">{answered} answered</span>
                        <span>•</span>
                        <span className="text-slate-500">{unattempted} unattempted</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {quizTimeLeft !== null && (
                        <span className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border ${
                          quizTimeLeft < 60
                            ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(quizTimeLeft/60)}:{String(quizTimeLeft%60).padStart(2,'0')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSubmitConfirm(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Finish &</span> Submit
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5">
                    <div
                      className="bg-gradient-to-r from-green-600 to-indigo-600 h-1.5 transition-all duration-300"
                      style={{width:`${((quizPlayerIndex+1)/quizPlayerQuestions.length)*100}%`}}
                    />
                  </div>

                  {/* Question & Options Area */}
                  <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <p className="text-base font-semibold text-slate-900 leading-relaxed flex-1">
                        {q.question}
                      </p>
                      
                      {/* Action buttons: Read Aloud & Clear Choice */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReadQuestion(q, quizPlayerIndex)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shadow-sm active:scale-95 ${
                            isSpeaking
                              ? 'bg-purple-100 border-purple-300 text-purple-700 animate-pulse'
                              : 'bg-white hover:bg-purple-50 border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700'
                          }`}
                          title="Click to hear question and options read aloud"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-purple-600" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                              <span>Read Aloud</span>
                            </>
                          )}
                        </button>

                        {currentAnswer >= 0 && (
                          <button
                            type="button"
                            onClick={() => handleSelectAnswer(-1)}
                            className="text-xs font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
                          >
                            ✕ Clear Choice
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3 pt-1">
                      {(q.options || []).map((opt: string, idx: number) => {
                        const isSelected = currentAnswer === idx;
                        const optionLetter = ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectAnswer(idx)}
                            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-sm ring-1 ring-purple-400/30'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-green-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                                  isSelected
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-green-100 group-hover:text-green-700'
                                }`}
                              >
                                {optionLetter}
                              </span>
                              <span className="font-semibold">{opt}</span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Bar */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-white">
                    {/* Previous Button */}
                    <button
                      onClick={() => setQuizPlayerIndex(i => Math.max(0, i - 1))}
                      disabled={quizPlayerIndex === 0}
                      className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 rounded-xl transition-all active:scale-95 shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    {/* Scrollable Center Question Indicators */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2 max-w-[200px] sm:max-w-xs md:max-w-md no-scrollbar justify-center shrink">
                      {quizPlayerQuestions.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setQuizPlayerIndex(i)}
                          className={`w-7 h-7 shrink-0 rounded-full text-xs font-bold transition-all ${
                            i === quizPlayerIndex
                              ? 'bg-purple-900 text-white ring-2 ring-purple-300 shadow-sm scale-105'
                              : quizPlayerAnswers[i]?.selectedIndex >= 0
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    {/* Next / Submit Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {quizPlayerIndex < quizPlayerQuestions.length - 1 ? (
                        <button
                          onClick={() => setQuizPlayerIndex(i => i + 1)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md shadow-green-500/20 transition-all active:scale-95"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowSubmitConfirm(true)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Submit Quiz
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submit Confirmation Modal Overlay */}
                  {showSubmitConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">Ready to Submit?</h3>
                            <p className="text-xs text-slate-500">Review your progress before final submission</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-1">
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-emerald-700">{answered}</p>
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Answered</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-slate-700">{unattempted}</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unattempted</p>
                          </div>
                        </div>

                        {quizPlayerQuiz.enableNegativeMarking && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                            ⚠️ <strong>Negative Marking:</strong> Wrong answers deduct {quizPlayerQuiz.negativeMark || 0.25} marks. Unattempted questions receive 0 penalty.
                          </div>
                        )}

                        <p className="text-xs text-slate-500">
                          Once submitted, your answers will be graded immediately and cannot be modified.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowSubmitConfirm(false)}
                            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                          >
                            Back to Quiz
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <><Loader size="sm" /> Submitting...</>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4" /> Confirm & Submit</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* RESULT */}
            {quizPlayerPhase === 'result' && quizResult && (
              <>
                <div className={`p-6 text-center ${ quizResult.passed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                    {quizResult.passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <p className="text-4xl font-black mb-0.5">{quizResult.score ?? quizResult.percentScore}%</p>
                  <p className="text-base font-bold opacity-90">{quizResult.passed ? '🎉 Passed!' : 'Not Passed'}</p>
                  <p className="text-xs opacity-80 mt-1">{quizResult.totalMarks} / {quizResult.maxMarks} marks</p>
                </div>

                <div className="overflow-y-auto p-5 space-y-4 flex-1">
                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-emerald-700">{quizResult.correctCount ?? 0}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">Correct</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-rose-700">{quizResult.wrongCount ?? 0}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mt-0.5">Wrong</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-slate-700">{quizResult.unattemptedCount ?? 0}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Unattempted</p>
                    </div>
                  </div>

                  {/* Mathematical Calculation Card */}
                  {quizResult.markingScheme?.enableNegativeMarking && (
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>PPSC Marking Calculation</span>
                        <span className="text-emerald-400">Total: {quizResult.totalMarks} / {quizResult.maxMarks}</span>
                      </p>
                      <div className="font-mono text-[11px] bg-slate-800 p-2.5 rounded-lg space-y-1">
                        <div className="flex justify-between">
                          <span className="text-emerald-400">Correct ({quizResult.correctCount} × +{quizResult.markingScheme.correctMark})</span>
                          <span>+{((quizResult.correctCount || 0) * (quizResult.markingScheme.correctMark || 1)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-rose-400">Wrong ({quizResult.wrongCount} × -{quizResult.markingScheme.negativeMark})</span>
                          <span>-{((quizResult.wrongCount || 0) * (quizResult.markingScheme.negativeMark || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unattempted ({quizResult.unattemptedCount} × {quizResult.markingScheme.unattemptedMark})</span>
                          <span>+{((quizResult.unattemptedCount || 0) * (quizResult.markingScheme.unattemptedMark || 0)).toFixed(2)}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-700 flex justify-between font-bold text-white">
                          <span>Final Score:</span>
                          <span className="text-emerald-400">{quizResult.totalMarks} Marks ({quizResult.percentScore}%)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Breakdown */}
                  {(() => {
                    const rawList = quizResult.breakdown || quizResult.answers || [];
                    const breakdown = rawList.length > 0 ? rawList : quizPlayerQuestions.map((q: any, idx: number) => ({
                      questionId: q._id,
                      question: q.question,
                      options: q.options,
                      explanation: q.explanation,
                      selectedIndex: quizPlayerAnswers[idx]?.selectedIndex ?? -1,
                      correctAnswer: q.correctIndex,
                      isCorrect: (quizPlayerAnswers[idx]?.selectedIndex ?? -1) === q.correctIndex,
                      status: (quizPlayerAnswers[idx]?.selectedIndex ?? -1) === q.correctIndex ? 'correct' : ((quizPlayerAnswers[idx]?.selectedIndex ?? -1) >= 0 ? 'wrong' : 'unattempted')
                    }));

                    if (breakdown && breakdown.length > 0) {
                      return (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <span>📝</span> Detailed Question Review & Explanations ({breakdown.length})
                            </p>
                          </div>

                          {breakdown.map((item: any, idx: number) => {
                            const fallbackQ = quizPlayerQuestions[idx] || {};
                            const questionText = item.question || fallbackQ.question || `Question ${idx + 1}`;
                            const options = item.options || fallbackQ.options || [];
                            const explanation = item.explanation || fallbackQ.explanation || '';
                            const selectedIdx = item.selectedIndex !== undefined ? item.selectedIndex : (quizPlayerAnswers[idx]?.selectedIndex ?? -1);
                            const correctIdx = item.correctAnswer !== undefined ? item.correctAnswer : (item.correctIndex !== undefined ? item.correctIndex : fallbackQ.correctIndex);
                            
                            const isCorrect = item.status === 'correct' || (item.isCorrect && item.status !== 'unattempted') || (selectedIdx >= 0 && selectedIdx === correctIdx);
                            const isUnattempted = item.status === 'unattempted' || selectedIdx < 0;
                            const isWrong = !isCorrect && !isUnattempted;

                            const optionLetters = ['A', 'B', 'C', 'D'];

                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : isWrong
                                    ? 'bg-rose-50/60 border-rose-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                {/* Question Title Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-xs">
                                        Q{idx + 1}
                                      </span>
                                      {isCorrect && (
                                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          +{item.marksAwarded ?? 1} Correct
                                        </span>
                                      )}
                                      {isWrong && (
                                        <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                          <XCircle className="w-3 h-3 text-rose-600" />
                                          {item.marksAwarded !== undefined ? item.marksAwarded : '-0.25'} Wrong
                                        </span>
                                      )}
                                      {isUnattempted && (
                                        <span className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-md">
                                          0 Unattempted
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 leading-relaxed">
                                      {questionText}
                                    </p>
                                  </div>

                                  <div className="shrink-0">
                                    {isCorrect ? (
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                      </div>
                                    ) : isWrong ? (
                                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                        <XCircle className="w-5 h-5" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                                        -
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Options Details */}
                                {options.length > 0 && (
                                  <div className="mt-3 space-y-1.5">
                                    {options.map((opt: string, optIdx: number) => {
                                      const isStudentChoice = selectedIdx === optIdx;
                                      const isActualCorrect = correctIdx === optIdx;

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`text-xs px-3 py-2 rounded-xl flex items-center justify-between border ${
                                            isActualCorrect
                                              ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950 font-semibold'
                                              : isStudentChoice && !isActualCorrect
                                              ? 'bg-rose-100/80 border-rose-300 text-rose-950 font-semibold'
                                              : 'bg-white/80 border-slate-200 text-slate-600'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                                              isActualCorrect
                                                ? 'bg-emerald-600 text-white'
                                                : isStudentChoice
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                              {optionLetters[optIdx] || optIdx + 1}
                                            </span>
                                            <span>{opt}</span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold">
                                            {isStudentChoice && (
                                              <span className={`px-2 py-0.5 rounded ${isActualCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}`}>
                                                Your Answer
                                              </span>
                                            )}
                                            {isActualCorrect && (
                                              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Correct Answer
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Answer Explanation Card */}
                                {explanation ? (
                                  <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                      <span>💡</span>
                                      <span className="uppercase tracking-wider text-[10px]">Explanation</span>
                                    </div>
                                    <p className="text-amber-950 font-medium leading-relaxed pl-5">
                                      {explanation}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-2 text-[11px] text-slate-400 italic">
                                    No specific explanation provided for this question.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div className="text-center text-slate-500 py-6 text-sm bg-slate-50 rounded-xl border border-slate-200">
                        Detailed breakdown is not available for this attempt.
                      </div>
                    );
                  })()}
                </div>
                <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {quizPlayerQuiz && (quizPlayerQuiz.allowRetake !== false || (quizPlayerQuiz.myAttempts || 0) < (quizPlayerQuiz.maxAttempts || 1)) ? (
                    <button
                      onClick={handleBeginAttempt}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Quiz
                    </button>
                  ) : <div />}
                  <button onClick={() => setShowQuizPlayer(false)} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Bulk Quiz Upload Modal */}
      {showBulkUploadModal && (
        <BulkQuizUploadModal
          courseId={courseId}
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={(newQuiz) => {
            fetchQuizzes(courseId);
            if (newQuiz) {
              setCurrentQuiz(newQuiz);
            }
          }}
        />
      )}
    </div>
  );
}
