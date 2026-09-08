"use client";

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Layers,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import Loader from '@/components/ui/Loader';
import * as lmsService from '@/services/lms.service';

interface QuestionRow {
  rowNumber: number;
  question: string;
  options: string[];
  correctAnswer: string;
  correctIndex: number;
  explanation: string;
  marks: number;
  errors: string[];
  isValid: boolean;
}

interface ValidationReport {
  isValid: boolean;
  totalQuestions: number;
  validCount: number;
  errorCount: number;
  totalMarks: number;
  maxAllowedQuestions: number;
  globalErrors: string[];
  questions: QuestionRow[];
}

interface BulkQuizUploadModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdQuiz: any) => void;
}

export default function BulkQuizUploadModal({
  courseId,
  isOpen,
  onClose,
  onSuccess,
}: BulkQuizUploadModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation report state
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'errors'>('all');

  // Quiz settings form state
  const [quizForm, setQuizForm] = useState({
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
    unattemptedMark: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setErrorMessage(null);
    try {
      await lmsService.downloadQuizTemplate();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleSelectedFile(droppedFile);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Please upload a valid Excel spreadsheet (.xlsx or .xls).');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    // Autofill a sensible quiz title from the file name if not already set
    if (!quizForm.title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const formattedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setQuizForm(prev => ({ ...prev, title: formattedTitle }));
    }
  };

  const handleValidateFile = async () => {
    if (!file) {
      setErrorMessage('Please select or drop an Excel file to validate.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const validationData = await lmsService.validateQuizExcel(courseId, file);
      setReport(validationData);
      setStep(2);
      if (!validationData.isValid) {
        setFilterView('errors');
      } else {
        setFilterView('all');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Validation failed. Please verify that your Excel file is correctly formatted.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmAndCreate = async () => {
    if (!report || !report.isValid || report.questions.length === 0) {
      setErrorMessage('Cannot create quiz because the file contains validation errors.');
      return;
    }

    if (!quizForm.title.trim()) {
      setErrorMessage('Please provide a quiz title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        quiz: {
          title: quizForm.title.trim(),
          instructions: quizForm.instructions.trim(),
          timeLimit: quizForm.timeLimit ? parseInt(quizForm.timeLimit, 10) : null,
          passMark: Number(quizForm.passMark),
          maxAttempts: Number(quizForm.maxAttempts),
          allowRetake: quizForm.allowRetake !== false,
          shuffleQuestions: quizForm.shuffleQuestions,
          showResultImmediately: quizForm.showResultImmediately,
          enableNegativeMarking: quizForm.enableNegativeMarking,
          correctMark: Number(quizForm.correctMark) || 1,
          negativeMark: Number(quizForm.negativeMark) || 0,
          unattemptedMark: Number(quizForm.unattemptedMark) || 0,
          status: 'draft',
        },
        questions: report.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          marks: q.marks,
        })),
      };

      const result = await lmsService.bulkCreateQuiz(courseId, payload);
      onSuccess(result?.data || result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to create quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedQuestions = report?.questions.filter(q => {
    if (filterView === 'errors') return !q.isValid;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Bulk Quiz Upload via Excel</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20">
                  MCQ Importer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Create a full quiz and upload up to 100 questions in seconds.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6 text-xs font-semibold">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>1</span>
              <span>Upload & Validate</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span>Preview & Diagnostics</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>3</span>
              <span>Settings & Confirm</span>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloadingTemplate ? 'Downloading...' : 'Get Excel Template'}
          </button>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ═══════════════ STEP 1: UPLOAD & VALIDATE ═══════════════ */}
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Template Download Card */}
              <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Need the official format?</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Download our pre-formatted spreadsheet template with sample questions and standard columns.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  {isDownloadingTemplate ? 'Downloading...' : 'Download Template (.xlsx)'}
                </button>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                    : file
                    ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                    : 'border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Ready for validation</p>
                    <span className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                      Click or drop another file to replace
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag and drop your Excel file here, or <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls files up to 20MB</p>
                  </div>
                )}
              </div>

              {/* Requirement Checklist */}
              <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Required Excel Spreadsheet Format:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Question</strong>: Full question text (up to 2000 chars)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Options A, B, C, D</strong>: All 4 choices are required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Correct Answer</strong>: Must be A, B, C, or D</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Marks</strong>: Positive integer (default 1 if blank)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Explanation</strong>: Optional feedback for students</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Limit</strong>: Up to 100 questions per quiz</span>
                  </div>
                </div>
              </div>

              {/* Validate Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleValidateFile}
                  disabled={!file || isValidating}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-blue-500/20 active:scale-[0.98]"
                >
                  {isValidating ? (
                    <>
                      <Loader size="sm" />
                      Validating Spreadsheet...
                    </>
                  ) : (
                    <>
                      Validate & Review Questions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 2: PREVIEW & DIAGNOSTICS ═══════════════ */}
          {step === 2 && report && (
            <div className="space-y-6">
              
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">{report.totalQuestions}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Questions</p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-700">{report.validCount}</p>
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Valid Questions</p>
                </div>
                <div className={`rounded-2xl p-4 text-center border ${
                  report.errorCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200/70 text-slate-400'
                }`}>
                  <p className="text-2xl font-black">{report.errorCount}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5">Errors Found</p>
                </div>
                <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-700">{report.totalMarks}</p>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">Total Marks</p>
                </div>
              </div>

              {/* Status Header & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {report.isValid ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      All {report.totalQuestions} Questions Passed Validation
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100/80 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      {report.errorCount} Question(s) Contain Errors — Must Be Fixed Before Import
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterView('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterView === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Questions ({report.totalQuestions})
                  </button>
                  {report.errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterView('errors')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterView === 'errors'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      Errors Only ({report.errorCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Global Errors Alert if any */}
              {report.globalErrors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 text-xs text-rose-800">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    File-Level Errors:
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-rose-700">
                    {report.globalErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions Table / List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {displayedQuestions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                      No questions match the current filter.
                    </div>
                  ) : (
                    displayedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className={`p-4 transition-colors ${
                          !q.isValid ? 'bg-rose-50/50 hover:bg-rose-50' : 'bg-white hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-bold flex-shrink-0 ${
                              q.isValid ? 'bg-slate-100 text-slate-700' : 'bg-rose-200 text-rose-800'
                            }`}>
                              Row {q.rowNumber}
                            </span>
                            <div className="space-y-2 flex-1">
                              <p className="text-sm font-bold text-slate-900 leading-snug">
                                {q.question || <span className="text-rose-500 italic">Empty Question</span>}
                              </p>

                              {/* Options grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt, oIdx) => {
                                  const letter = ['A', 'B', 'C', 'D'][oIdx];
                                  const isCorrect = q.correctIndex === oIdx;
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                                        isCorrect
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                                          : 'border-slate-200 bg-slate-50 text-slate-700'
                                      }`}
                                    >
                                      <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                      }`}>
                                        {letter}
                                      </span>
                                      <span className="truncate">{opt || <span className="text-rose-400 italic">Empty</span>}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation & Marks Info */}
                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {q.marks} Mark{q.marks !== 1 ? 's' : ''}
                                </span>
                                {q.explanation && (
                                  <span className="italic truncate max-w-md">
                                    💡 Explanation: {q.explanation}
                                  </span>
                                )}
                              </div>

                              {/* Row Error Badges */}
                              {q.errors.length > 0 && (
                                <div className="pt-2 space-y-1">
                                  {q.errors.map((err, eIdx) => (
                                    <div key={eIdx} className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {q.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Error
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Re-upload Excel File
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!report.isValid || report.errorCount > 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-blue-500/20 active:scale-[0.98]"
                >
                  Proceed to Quiz Settings
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3: SETTINGS & CONFIRMATION ═══════════════ */}
          {step === 3 && report && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Ready Summary Banner */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">File Validated Successfully</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Ready to create quiz with <strong>{report.totalQuestions} questions</strong> ({report.totalMarks} total marks). Configure the quiz parameters below to finalize.
                  </p>
                </div>
              </div>

              {/* Quiz Configuration Form */}
              <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Quiz Title *</label>
                  <input
                    required
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                    placeholder="e.g. Midterm MCQ Assessment"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Instructions</label>
                  <textarea
                    value={quizForm.instructions}
                    onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                    placeholder="Instructions for students (e.g. Choose the best answer. No negative marking.)..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Time Limit (mins)</label>
                    <input
                      type="number"
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm({ ...quizForm, timeLimit: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="0 = No limit"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pass Mark (%)</label>
                    <input
                      type="number"
                      value={quizForm.passMark}
                      onChange={(e) => setQuizForm({ ...quizForm, passMark: parseInt(e.target.value) || 60 })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Max Attempts {quizForm.allowRetake ? '(1 or 0 for unlimited)' : '(Fixed: 1)'}
                    </label>
                    <input
                      type="number"
                      value={quizForm.maxAttempts}
                      disabled={!quizForm.allowRetake}
                      onChange={(e) => setQuizForm({ ...quizForm, maxAttempts: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Allow Quiz Retakes</p>
                      <p className="text-[11px] text-slate-500">Students can retake this quiz to practice and improve their score</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuizForm({ ...quizForm, allowRetake: !quizForm.allowRetake })}
                      className="flex items-center"
                    >
                      {quizForm.allowRetake ? (
                        <ToggleRight className="w-9 h-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-9 h-6 text-slate-300" />
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
                      onClick={() => setQuizForm({ ...quizForm, shuffleQuestions: !quizForm.shuffleQuestions })}
                      className="flex items-center"
                    >
                      {quizForm.shuffleQuestions ? (
                        <ToggleRight className="w-9 h-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-9 h-6 text-slate-300" />
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
                      onClick={() => setQuizForm({ ...quizForm, showResultImmediately: !quizForm.showResultImmediately })}
                      className="flex items-center"
                    >
                      {quizForm.showResultImmediately ? (
                        <ToggleRight className="w-9 h-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-9 h-6 text-slate-300" />
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
                            Competitive Exam
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">Deduct marks for wrong answers (e.g. +1 / -0.25 scheme)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuizForm({ ...quizForm, enableNegativeMarking: !quizForm.enableNegativeMarking })}
                        className="flex items-center"
                      >
                        {quizForm.enableNegativeMarking ? (
                          <ToggleRight className="w-9 h-6 text-blue-600" />
                        ) : (
                          <ToggleLeft className="w-9 h-6 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {quizForm.enableNegativeMarking && (
                      <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-amber-900 mb-1">
                              Correct Mark (+)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={quizForm.correctMark}
                              onChange={(e) => setQuizForm({ ...quizForm, correctMark: parseFloat(e.target.value) || 0 })}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="1"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-amber-900 mb-1">
                              Wrong Penalty (-)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={quizForm.negativeMark}
                              onChange={(e) => setQuizForm({ ...quizForm, negativeMark: parseFloat(e.target.value) || 0 })}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="0.25"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-amber-900 mb-1">
                              Unattempted Mark
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={quizForm.unattemptedMark}
                              onChange={(e) => setQuizForm({ ...quizForm, unattemptedMark: parseFloat(e.target.value) || 0 })}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] font-medium text-amber-800 bg-amber-100/70 p-2.5 rounded-lg flex items-center justify-between">
                          <span>Marking Scheme Formula:</span>
                          <span className="font-mono font-bold">
                            Score = (Correct × {quizForm.correctMark || 1}) - (Wrong × {quizForm.negativeMark || 0}) + (Unattempted × {quizForm.unattemptedMark || 0})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Question Preview
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndCreate}
                  disabled={isSubmitting || !quizForm.title.trim()}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-emerald-600/20 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size="sm" />
                      Creating Quiz & Questions...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Create Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
