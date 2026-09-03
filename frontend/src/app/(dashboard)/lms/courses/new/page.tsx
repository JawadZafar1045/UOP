"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, CheckCircle, ArrowLeft,
  Save, Rocket, Eye, Lightbulb, X, GraduationCap
} from 'lucide-react';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';
import api from '@/services/api';
import * as lmsService from '@/services/lms.service';

export default function NewCoursePage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // ── Academic hierarchy state ────────────────────────────────────
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicData, setAcademicData] = useState({
    programId: '',
    courseCode: '',
  });

  useEffect(() => {
    lmsService.getPrograms().then(p => {
      const list = Array.isArray(p) ? p : (p?.data || []);
      setPrograms(list);
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlProgId = searchParams.get('programId');
      const urlTitle = searchParams.get('title');

      if (urlProgId) {
        setAcademicData(prev => ({
          ...prev,
          programId: urlProgId,
        }));
      }
      if (urlTitle) {
        setFormData(prev => ({
          ...prev,
          title: urlTitle,
        }));
      }
    }
  }, []);

  const set = (key: string, val: any) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Course title is required.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Course description is required.');
      return;
    }

    if (!academicData.programId) {
      setError('Please select a Target Program Track.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: 'active',
        ...(academicData.programId ? { programId: academicData.programId } : {}),
        ...(academicData.courseCode ? { courseCode: academicData.courseCode.trim() } : {}),
      };

      const res: any = await api.post('/lms/courses', payload);
      const courseId = res?.data?._id || res?._id || res?.data?.data?._id;

      setPublished(true);

      setTimeout(() => {
        if (courseId) {
          router.push(`/lms/courses/${courseId}`);
        } else {
          router.push('/lms');
        }
      }, 1200);

    } catch (err: any) {
      console.error('PUBLISH ERROR:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create course'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-500/10 transition-all';
  const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2';

  const selectedProgramName = programs.find(p => p._id === academicData.programId)?.name;

  // ── published screen ────────────────────────────────────────────
  if (published) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5 text-green-700">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Subject Created Successfully!</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your course is now active and students enrolled in this program track can immediately access it.
          </p>
          <Link href="/lms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-all shadow-md">
            View All Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/lms"
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-xs">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Create New Course / Subject</h1>
            <p className="text-xs text-slate-500">Provide the essential information to publish this course</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-5 py-3.5 rounded-2xl border border-red-200 text-sm flex items-center gap-3 shadow-xs">
          <X className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Form & Preview Grid */}
      <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        
        {/* Main Form Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Course Information</h2>
              <p className="text-xs text-slate-500">Essential details required for students</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Course Title */}
            <div>
              <label className={lbl}>
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => set('title', e.target.value)}
                className={inputCls}
                placeholder="e.g. Principles of Agronomy & Crop Production"
              />
            </div>

            {/* Description */}
            <div>
              <label className={lbl}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={e => set('description', e.target.value)}
                className={inputCls + ' resize-none'}
                placeholder="What will students learn in this course? Outline key topics and objectives..."
              />
              <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                A concise syllabus summary displayed to enrolled students.
              </p>
            </div>

            {/* Program Track Selection */}
            {programs.length > 0 && (
              <div className="bg-green-50/50 border border-green-200/70 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-green-700" />
                  Target Program Track
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>
                      Assign to Program Track <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={academicData.programId}
                      onChange={e => setAcademicData(prev => ({ ...prev, programId: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">-- Select Target Program Track * --</option>
                      {programs.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.code ? `(${p.code})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-green-800/80 mt-1.5 ml-1">
                      Students approved for this program track will be enrolled into this course automatically.
                    </p>
                  </div>

                  <div>
                    <label className={lbl}>Course / Subject Code (Optional)</label>
                    <input
                      type="text"
                      value={academicData.courseCode}
                      onChange={e => setAcademicData(prev => ({ ...prev, courseCode: e.target.value }))}
                      className={inputCls + ' uppercase font-mono'}
                      placeholder="e.g. AGRO-101"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/lms"
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-green-700/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" /> Publishing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Publish Course
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Eye className="w-4 h-4 text-green-700" />
              <span>Live Preview</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Title</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formData.title || <span className="text-slate-400 italic">Not set</span>}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Program Track</span>
                <p className="text-xs font-semibold text-green-800 mt-0.5">
                  {selectedProgramName || <span className="text-slate-400 italic">Standalone</span>}
                </p>
              </div>

              {academicData.courseCode && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Code</span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                    {academicData.courseCode}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-3 leading-relaxed">
                  {formData.description || <span className="text-slate-400 italic">Add description...</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/70 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Quick Tip</span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              Once published, you can upload video lectures, conduct quizzes, and track student attendance directly inside the course hub.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}