"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLmsStore } from '@/store/lmsStore';
import {
  BookOpen, CheckCircle, ArrowLeft, ChevronRight, ChevronLeft,
  Save, Flame, TrendingUp, Sprout, Users, Trash2, Plus,
  Rocket, Eye, Lightbulb, LayoutList, Paperclip, Clock,
  CalendarCheck, Pencil, HelpCircle, X, Upload, Image as ImageIcon
} from 'lucide-react';
import Loader from '@/components/ui/Loader';
import Link from 'next/link';
import api from '@/services/api';
import * as lmsService from '@/services/lms.service';

const STEPS = [
  { id: 1, label: 'General info' },
  { id: 2, label: 'Requirements' },
  { id: 3, label: 'Content' },
  { id: 4, label: 'Review' },
];

const LEVELS = [
  { label: 'Beginner',     icon: Sprout },
  { label: 'Intermediate', icon: TrendingUp },
  { label: 'Advanced',     icon: Flame },
  { label: 'All levels',   icon: Users },
];

const CATEGORIES = ['Mathematics', 'Science', 'Languages', 'Technology', 'Arts'];
const DURATIONS  = ['30 minutes', '45 minutes', '1 hour', '1.5 hours', '2 hours'];

function fmtDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function NewCoursePage() {
  const router = useRouter();
  const { createCourse } = useLmsStore();

  const [step, setStep]               = useState(1);
  const [maxVisited, setMaxVisited]   = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished]     = useState(false);
  const [error, setError]             = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    category: '',
    maxStudents: '',
    level: 'Intermediate',
    tags: ['algebra', 'math'] as string[],
    completionCriteria: {
      minAttendancePercent: 75,
      minAssignmentScore: 60,
      minQuizScore: 60,
    },
    totalHours: '',
    sessionsPerWeek: '',
    sessionDuration: '',
    modules: ['Introduction & Overview', 'Core Concepts', 'Practical Applications'],
    resourceLink: '',
    studentNotes: '',
    status: 'active',
    thumbnail: '',
    featuredOnHomepage: false,
  });

  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const [tagInput, setTagInput] = useState('');

  // ── Academic hierarchy state ────────────────────────────────────
  const [programs, setPrograms] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [academicData, setAcademicData] = useState({
    programId: '',
    majorId: '',
    isCommon: false,
    courseCode: '',
    creditHours: 3,
  });

  useEffect(() => {
    lmsService.getPrograms().then(p => setPrograms(p || [])).catch(() => {});
    lmsService.getMajors().then(m => setMajors(m || [])).catch(() => {});

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlProgId = searchParams.get('programId');
      const urlMajorId = searchParams.get('majorId');
      const urlTitle = searchParams.get('title');

      if (urlProgId || urlMajorId) {
        setAcademicData(prev => ({
          ...prev,
          programId: urlProgId || '',
          majorId: urlMajorId || '',
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

  const filteredMajors = majors.filter(m => !academicData.programId || String(m.programId?._id || m.programId) === academicData.programId);

  const goTo = (n: number) => {
    if (n > maxVisited + 1) return;
    setStep(n);
    if (n > maxVisited) setMaxVisited(n);
  };

  const set = (key: string, val: any) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  const setCriteria = (key: string, val: number) =>
    setFormData(prev => ({
      ...prev,
      completionCriteria: { ...prev.completionCriteria, [key]: val },
    }));

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      set('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (i: number) =>
    set('tags', formData.tags.filter((_, idx) => idx !== i));

  const addModule = () =>
    set('modules', [...formData.modules, '']);

  const updateModule = (i: number, val: string) => {
    const m = [...formData.modules];
    m[i] = val;
    set('modules', m);
  };

  const deleteModule = (i: number) => {
    if (formData.modules.length > 1)
      set('modules', formData.modules.filter((_, idx) => idx !== i));
  };

  const handlePublish = async () => {
  setError('');

  if (!formData.description.trim()) {
    setError('Course description is required');
    setStep(1);
    return;
  }

  // Validate dates
  if (
    formData.endDate &&
    formData.startDate &&
    new Date(formData.endDate) <= new Date(formData.startDate)
  ) {
    setError('End date must be after start date');
    setStep(1);
    return;
  }

  setIsSubmitting(true);

  try {
    // Complete payload
    const payload = {
    title: formData.title,
    description: formData.description,
    startDate: formData.startDate,
    endDate: formData.endDate,

    category: formData.category,
    maxStudents: formData.maxStudents,
    level: formData.level,
    tags: formData.tags,

    completionCriteria: {
      minAttendancePercent:
        formData.completionCriteria.minAttendancePercent,

      minAssignmentScore:
        formData.completionCriteria.minAssignmentScore,

      minQuizScore:
        formData.completionCriteria.minQuizScore,
    },

    totalHours: formData.totalHours,
    sessionsPerWeek: formData.sessionsPerWeek,
    sessionDuration: formData.sessionDuration,

    // FIX HERE
    modules: formData.modules
      .map((module) => module.trim())
      .filter(Boolean)
      .map((module) => ({
        title: module,
      })),

    resourceLink: formData.resourceLink,
    studentNotes: formData.studentNotes,

    status: formData.status,
    thumbnail: formData.thumbnail,
    featuredOnHomepage: formData.featuredOnHomepage,

    // Academic hierarchy
    ...(academicData.programId ? { programId: academicData.programId } : {}),
    ...(academicData.majorId && !academicData.isCommon ? { majorId: academicData.majorId } : {}),
    isCommon: academicData.isCommon,
    ...(academicData.courseCode ? { courseCode: academicData.courseCode } : {}),
    creditHours: academicData.creditHours,
  };

    // API call
    const res = await api.post('/lms/courses', payload);

    console.log('API RESPONSE:', res.data);

    // Extract course ID safely
    const courseId =
      res?.data?.data?._id ||
      res?.data?._id;

    // Check ID exists
    if (!courseId) {
      throw new Error('Course ID not found in response');
    }

    // Show success screen
    setPublished(true);

    // Redirect after short delay
    setTimeout(() => {
      router.push(`/lms/courses/${courseId}`);
    }, 1500);

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
  // ── shared classes ──────────────────────────────────────────────
  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

  const card = 'bg-white rounded-2xl border border-slate-200 overflow-hidden mb-3 last:mb-0';
  const cardHead = 'flex items-center gap-3 px-5 py-4 border-b border-slate-100';
  const cardBody = 'px-5 py-4';
  const lbl = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  const iconBox = (bg: string, text: string) =>
    `w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`;

  // ── step bar ────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 mb-4">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 min-w-0">
          <button
            onClick={() => goTo(s.id)}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-all min-w-0 ${
              step === s.id
                ? 'bg-blue-50 text-blue-700'
                : step > s.id
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
              step > s.id
                ? 'bg-emerald-500 text-white'
                : step === s.id
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.id ? <CheckCircle className="w-3 h-3" /> : s.id}
            </span>
            <span className="hidden sm:block whitespace-nowrap">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="w-px h-5 bg-slate-200 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );

  // ── sidebar cards ───────────────────────────────────────────────
  const TipsCard = ({ tips }: { tips: string[] }) => (
    <div className={card}>
      <div className={cardHead}>
        <div className={iconBox('bg-amber-50', 'text-amber-600')}>
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Tips</p>
        </div>
      </div>
      <div className={cardBody + ' space-y-2.5'}>
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-slate-500 leading-relaxed">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── slider component ────────────────────────────────────────────
  const Slider = ({
    icon: Icon, iconBg, iconText, barColor,
    label, valKey, val,
  }: {
    icon: any; iconBg: string; iconText: string; barColor: string;
    label: string; valKey: string; val: number;
  }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2.5 last:mb-0">
      <div className={iconBox(iconBg, iconText)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500">{label}</span>
          <span className="text-sm font-semibold text-slate-800">{val}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={1} value={val}
          onChange={e => setCriteria(valKey, Number(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />
        <div className="h-1 rounded-full bg-slate-200 mt-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${val}%` }} />
        </div>
      </div>
    </div>
  );

  // ── published screen ────────────────────────────────────────────
  if (published) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Course published!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your course is now live. Students can enroll starting from the set start date.
          </p>
          <Link href="/lms"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/lms"
            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-snug">Create new course</h1>
            <p className="text-xs text-slate-500">Fill in the details to publish your course</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium flex-shrink-0">
          <Save className="w-3 h-3" /> Draft saved
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <StepBar />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 items-start">
          <div>
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-blue-50', 'text-blue-600')}><BookOpen className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">General information</p>
                  <p className="text-xs text-slate-400">Core details about your course</p>
                </div>
              </div>
              <div className={cardBody + ' space-y-3'}>
                <div>
                  <label className={lbl}>Course title <span className="text-red-400">*</span></label>
                  <input required type="text" value={formData.title}
                    onChange={e => set('title', e.target.value)}
                    className={inputCls} placeholder="e.g. Introduction to Advanced Mathematics" />
                </div>
                <div>
                  <label className={lbl}>Description <span className="text-red-400">*</span></label>
                  <textarea required rows={3} value={formData.description}
                    onChange={e => set('description', e.target.value)}
                    className={inputCls + ' resize-none'} placeholder="What will students learn? Describe key outcomes..." />
                  <p className="text-[11px] text-slate-400 mt-1">A clear description improves discoverability</p>
                </div>

                {/* Course Thumbnail & Homepage Display */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className={lbl}>Course Thumbnail (Cloudinary)</label>
                    <div className="flex items-center gap-3">
                      {formData.thumbnail ? (
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => set('thumbnail', '')}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white text-slate-400 text-xs">
                          <ImageIcon className="w-5 h-5 mb-1" />
                          <span>No Image</span>
                        </div>
                      )}

                      <div className="flex-1">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          {isUploadingThumbnail ? 'Uploading to Cloudinary...' : 'Upload Thumbnail'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingThumbnail}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingThumbnail(true);
                              try {
                                const url = await lmsService.uploadThumbnail(file);
                                set('thumbnail', url);
                              } catch (err: any) {
                                alert('Failed to upload thumbnail to Cloudinary');
                              } finally {
                                setIsUploadingThumbnail(false);
                              }
                            }}
                          />
                        </label>
                        <p className="text-[11px] text-slate-400 mt-1">Recommended size: 800x450px (JPG/PNG)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <label htmlFor="featuredOnHomepage" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Feature on Homepage
                    </label>
                    <input
                      id="featuredOnHomepage"
                      type="checkbox"
                      checked={formData.featuredOnHomepage}
                      onChange={(e) => set('featuredOnHomepage', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Category</label>
                    <select value={formData.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Max. students</label>
                    <input type="number" min={1} value={formData.maxStudents}
                      onChange={e => set('maxStudents', e.target.value)}
                      className={inputCls} placeholder="e.g. 30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Start date</label>
                    <input type="date" value={formData.startDate}
                      onChange={e => set('startDate', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={lbl}>End date</label>
                    <input type="date" value={formData.endDate}
                      onChange={e => set('endDate', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Difficulty level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LEVELS.map(({ label, icon: Icon }) => (
                      <button key={label} type="button" onClick={() => set('level', label)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          formData.level === label
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <label className={lbl}>Tags</label>
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag} className={inputCls} placeholder="Type and press Enter..." />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.tags.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {t}
                          <button type="button" onClick={() => removeTag(i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Academic Hierarchy ── */}
                {programs.length > 0 && (
                  <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1.5">
                      🎓 Academic Structure (Optional)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Degree / Program</label>
                        <select value={academicData.programId}
                          onChange={e => setAcademicData(prev => ({ ...prev, programId: e.target.value, majorId: '' }))}
                          className={inputCls}>
                          <option value="">None</option>
                          {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Course Code</label>
                        <input value={academicData.courseCode}
                          onChange={e => setAcademicData(prev => ({ ...prev, courseCode: e.target.value }))}
                          className={inputCls + ' uppercase font-mono'} placeholder="e.g. SOIL-201" />
                      </div>
                    </div>
                    {academicData.programId && (
                      <div>
                        <label className={lbl}>Common Subject?</label>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setAcademicData(prev => ({ ...prev, isCommon: !prev.isCommon, majorId: '' }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ academicData.isCommon ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ academicData.isCommon ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-xs text-slate-600">
                            {academicData.isCommon ? 'Yes – shared across all majors' : 'No – belongs to a specific major'}
                          </span>
                        </div>
                      </div>
                    )}
                    {academicData.programId && !academicData.isCommon && filteredMajors.length > 0 && (
                      <div>
                        <label className={lbl}>Major / Specialization</label>
                        <select value={academicData.majorId}
                          onChange={e => setAcademicData(prev => ({ ...prev, majorId: e.target.value }))}
                          className={inputCls}>
                          <option value="">Select major (optional)</option>
                          {filteredMajors.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={lbl}>Credit Hours</label>
                      <input type="number" min={0} max={10} step={0.5} value={academicData.creditHours}
                        onChange={e => setAcademicData(prev => ({ ...prev, creditHours: +e.target.value }))}
                        className={inputCls} placeholder="e.g. 3" />
                      <p className="text-[11px] text-indigo-500 mt-1">Used in weighted degree performance calculation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-purple-50', 'text-purple-600')}><Eye className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Live preview</p>
                  <p className="text-xs text-slate-400">Updates as you type</p>
                </div>
              </div>
              <div className={cardBody}>
                {[
                  ['Title',        formData.title || null],
                  ['Category',     formData.category || null],
                  ['Level',        formData.level],
                  ['Start date',   fmtDate(formData.startDate) || null],
                  ['End date',     fmtDate(formData.endDate) || null],
                  ['Max students', formData.maxStudents ? formData.maxStudents + ' students' : null],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-xs">
                    <span className="text-slate-500">{k}</span>
                    {v ? (
                      <span className="font-medium text-slate-800 max-w-[120px] truncate">{v}</span>
                    ) : (
                      <span className="text-slate-300 italic">Not set</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <TipsCard tips={[
              'A clear title improves search ranking significantly',
              '60–75% thresholds are industry standard',
              'Tags help students discover your course faster',
            ]} />
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 items-start">
          <div>
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-emerald-50', 'text-emerald-600')}><CheckCircle className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Certificate requirements</p>
                  <p className="text-xs text-slate-400">Minimum thresholds to earn a certificate</p>
                </div>
              </div>
              <div className={cardBody}>
                <Slider icon={CalendarCheck} iconBg="bg-blue-50" iconText="text-blue-600" barColor="bg-blue-500"
                  label="Min. attendance" valKey="minAttendancePercent" val={formData.completionCriteria.minAttendancePercent} />
                <Slider icon={Pencil} iconBg="bg-emerald-50" iconText="text-emerald-600" barColor="bg-emerald-500"
                  label="Min. assignment score" valKey="minAssignmentScore" val={formData.completionCriteria.minAssignmentScore} />
                <Slider icon={HelpCircle} iconBg="bg-amber-50" iconText="text-amber-600" barColor="bg-amber-500"
                  label="Min. quiz score" valKey="minQuizScore" val={formData.completionCriteria.minQuizScore} />
              </div>
            </div>

            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-blue-50', 'text-blue-600')}><Clock className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Course duration</p>
                  <p className="text-xs text-slate-400">Estimated time to complete</p>
                </div>
              </div>
              <div className={cardBody + ' space-y-3'}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Total hours</label>
                    <input type="number" min={1} value={formData.totalHours}
                      onChange={e => set('totalHours', e.target.value)}
                      className={inputCls} placeholder="e.g. 40" />
                  </div>
                  <div>
                    <label className={lbl}>Sessions / week</label>
                    <input type="number" min={1} value={formData.sessionsPerWeek}
                      onChange={e => set('sessionsPerWeek', e.target.value)}
                      className={inputCls} placeholder="e.g. 3" />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Session duration</label>
                  <select value={formData.sessionDuration} onChange={e => set('sessionDuration', e.target.value)} className={inputCls}>
                    <option value="">Select duration</option>
                    {DURATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div>
            <TipsCard tips={[
              '75% attendance is a common minimum for certification',
              'Set quiz threshold slightly lower than assignments',
              'Shorter sessions improve student retention rates',
            ]} />
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 items-start">
          <div>
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-purple-50', 'text-purple-600')}><LayoutList className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Course modules</p>
                  <p className="text-xs text-slate-400">Organize your content into modules</p>
                </div>
              </div>
              <div className={cardBody + ' space-y-2'}>
                {formData.modules.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <input type="text" value={m} onChange={e => updateModule(i, e.target.value)}
                      className="flex-1 bg-transparent border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 min-w-0"
                      placeholder="Module title..." />
                    <button type="button" onClick={() => deleteModule(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addModule}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 text-xs transition-colors mt-1">
                  <Plus className="w-3.5 h-3.5" /> Add module
                </button>
              </div>
            </div>

            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-rose-50', 'text-rose-600')}><Paperclip className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Resources & materials</p>
                  <p className="text-xs text-slate-400">Add links or notes for students</p>
                </div>
              </div>
              <div className={cardBody + ' space-y-3'}>
                <div>
                  <label className={lbl}>Resource link</label>
                  <input type="text" value={formData.resourceLink}
                    onChange={e => set('resourceLink', e.target.value)}
                    className={inputCls} placeholder="https://..." />
                </div>
                <div>
                  <label className={lbl}>Notes for students</label>
                  <textarea rows={3} value={formData.studentNotes}
                    onChange={e => set('studentNotes', e.target.value)}
                    className={inputCls + ' resize-none'}
                    placeholder="Prerequisites, tools needed, preparation instructions..." />
                </div>
              </div>
            </div>
          </div>
          <div>
            <TipsCard tips={[
              'Keep each module focused on one key topic',
              '5–8 modules is ideal for most courses',
              'Include prerequisite info to set student expectations',
            ]} />
          </div>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {step === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 items-start">
          <div className={card}>
            <div className={cardHead}>
              <div className={iconBox('bg-emerald-50', 'text-emerald-600')}><CheckCircle className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-800">Review & confirm</p>
                <p className="text-xs text-slate-400">Check all details before publishing</p>
              </div>
            </div>
            <div className={cardBody + ' space-y-5'}>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">General information</p>
                {[
                  ['Title',        formData.title || null],
                  ['Category',     formData.category || null],
                  ['Level',        formData.level],
                  ['Start date',   fmtDate(formData.startDate) || null],
                  ['End date',     fmtDate(formData.endDate) || null],
                  ['Max students', formData.maxStudents ? formData.maxStudents + ' students' : null],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-xs">
                    <span className="text-slate-500">{k}</span>
                    {v ? <span className="font-medium text-slate-800">{v}</span>
                       : <span className="text-slate-300 italic">Not set</span>}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Certificate requirements</p>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    Attendance: {formData.completionCriteria.minAttendancePercent}%
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    Assignment: {formData.completionCriteria.minAssignmentScore}%
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    Quiz: {formData.completionCriteria.minQuizScore}%
                  </span>
                </div>
              </div>
              {formData.modules.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Modules ({formData.modules.filter(Boolean).length})</p>
                  <div className="space-y-1">
                    {formData.modules.filter(Boolean).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center">{i+1}</span>
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-blue-50', 'text-blue-600')}><Pencil className="w-4 h-4" /></div>
                <div><p className="text-sm font-medium text-slate-800">Quick edit</p></div>
              </div>
              <div className={cardBody + ' space-y-2'}>
                {[
                  ['General info', 1],
                  ['Requirements', 2],
                  ['Content',      3],
                ].map(([label, n]) => (
                  <button key={label as string} type="button" onClick={() => goTo(n as number)}
                    className="w-full flex items-center gap-2 text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors py-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Edit {label}
                  </button>
                ))}
              </div>
            </div>
            <TipsCard tips={[
              'Double-check dates are correct',
              'You can edit the course after publishing',
              'Students will be notified once published',
            ]} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {step === 1 ? (
          <Link href="/lms"
            className="px-4 py-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        ) : (
          <button type="button" onClick={() => goTo(step - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < 4 ? (
          <button type="button" onClick={() => goTo(step + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Next step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handlePublish} disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {isSubmitting ? <><Loader size="sm" /> Publishing...</> : <><Rocket className="w-4 h-4" /> Publish course</>}
          </button>
        )}
      </div>
    </div>
  );
}