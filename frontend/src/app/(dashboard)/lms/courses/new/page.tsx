"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  BookOpen, CheckCircle, ArrowLeft, ChevronRight, ChevronLeft,
  Save, Flame, TrendingUp, Sprout, Users, Trash2, Plus,
  Rocket, Eye, Lightbulb, LayoutList, Paperclip, Clock,
  CalendarCheck, Pencil, HelpCircle, X, Upload, Image as ImageIcon,
  DollarSign, Sparkles, UserCheck, Calendar, ShieldCheck, Check
} from 'lucide-react';
import Loader from '@/components/ui/Loader';
import CourseThumbnailUpload from '@/components/ui/CourseThumbnailUpload';
import Link from 'next/link';
import api from '@/services/api';
import * as lmsService from '@/services/lms.service';

const STEPS = [
  { id: 1, label: 'Course Identity' },
  { id: 2, label: 'Pricing & Schedule' },
  { id: 3, label: 'Requirements & Outcomes' },
  { id: 4, label: 'Curriculum' },
  { id: 5, label: 'Review & Publish' },
];

const LEVELS = [
  { label: 'Beginner', icon: Sprout },
  { label: 'Intermediate', icon: TrendingUp },
  { label: 'Advanced', icon: Flame },
  { label: 'All levels', icon: Users },
];

const CATEGORIES = [
  'Cyber Security',
  'Web Development',
  'Cloud & DevOps',
  'Artificial Intelligence',
  'Data Science',
  'Mobile Development',
  'Software Engineering',
  'Computer Science',
  'General',
];

const PRESET_THUMBNAILS = [
  { label: 'Cyber Security', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Web Development', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cloud & DevOps', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
  { label: 'AI & Data', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Coding & Tech', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80' },
];

const DURATIONS = [
  '2 Hours',
  '4 Hours',
  '8 Hours',
  '12 Hours',
  '4 Weeks',
  '8 Weeks',
  '12 Weeks',
  'Self-paced',
];

function fmtDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useStore();

  const [step, setStep] = useState(1);
  const [maxVisited, setMaxVisited] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState('');
  const [error, setError] = useState('');

  // Instructors list from backend
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    instructor: '',
    instructorName: '',
    thumbnail: '',
    type: 'free' as 'free' | 'paid',
    price: 0,
    currency: 'PKR',
    category: 'Cyber Security',
    level: 'Intermediate',
    duration: '4 Hours',
    totalHours: '',
    sessionsPerWeek: '',
    sessionDuration: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    tags: [] as string[],
    completionCriteria: {
      minAttendancePercent: 75,
      minAssignmentScore: 60,
      minQuizScore: 60,
    },
    whatYouWillLearn: [] as string[],
    modules: [''] as string[],
    resourceLink: '',
    studentNotes: '',
    status: 'published',
    isFeatured: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [learnInput, setLearnInput] = useState('');

  // Fetch real registered instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      setLoadingInstructors(true);
      try {
        const data = await lmsService.getInstructors();
        const list = Array.isArray(data) ? data : [];
        setInstructors(list);

        // If user is teacher/admin, pre-select themselves by default if not set
        if (user?._id) {
          const match = list.find((inst: any) => inst._id === user._id);
          if (match) {
            setFormData((prev) => ({
              ...prev,
              instructor: prev.instructor || match._id,
              instructorName: prev.instructorName || match.name,
            }));
          }
        }
      } catch (e) {
        console.warn('Could not load instructors list:', e);
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();
  }, [user]);

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

  const handleInstructorChange = (instructorId: string) => {
    const found = instructors.find(i => i._id === instructorId);
    setFormData(prev => ({
      ...prev,
      instructor: instructorId,
      instructorName: found ? found.name : '',
    }));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        set('tags', [...formData.tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (i: number) =>
    set('tags', formData.tags.filter((_, idx) => idx !== i));

  const addLearnItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && learnInput.trim()) {
      e.preventDefault();
      set('whatYouWillLearn', [...formData.whatYouWillLearn, learnInput.trim()]);
      setLearnInput('');
    }
  };

  const removeLearnItem = (i: number) =>
    set('whatYouWillLearn', formData.whatYouWillLearn.filter((_, idx) => idx !== i));

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

    if (!formData.title.trim()) {
      setError('Course title is required');
      setStep(1);
      return;
    }

    if (!formData.description.trim()) {
      setError('Course description is required');
      setStep(1);
      return;
    }

    if (
      formData.endDate &&
      formData.startDate &&
      new Date(formData.endDate) <= new Date(formData.startDate)
    ) {
      setError('End date must be after start date');
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanModules = formData.modules
        .map(m => m.trim())
        .filter(Boolean)
        .map(title => ({ title, lectures: [] }));

      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim() || formData.description.trim().substring(0, 140),
        category: formData.category,
        level: formData.level,
        type: formData.type,
        price: formData.type === 'paid' ? Number(formData.price || 0) : 0,
        currency: formData.currency || 'PKR',
        duration: formData.duration || (formData.totalHours ? `${formData.totalHours} Hours` : 'Self-paced'),
        thumbnail: formData.thumbnail || '',
        instructor: formData.instructor || undefined,
        instructorName: formData.instructorName || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        maxStudents: formData.maxStudents ? Number(formData.maxStudents) : undefined,
        tags: formData.tags,
        whatYouWillLearn: formData.whatYouWillLearn.filter(Boolean),
        completionCriteria: formData.completionCriteria,
        status: formData.status,
        isFeatured: !!formData.isFeatured,
        modules: cleanModules,
        resourceLink: formData.resourceLink,
        studentNotes: formData.studentNotes,
      };

      if (formData.slug.trim()) {
        payload.slug = formData.slug.trim();
      }

      const res = await api.post('/lms/courses', payload);
      const newCourseId = res?.data?.data?._id || res?.data?._id;

      if (!newCourseId) {
        throw new Error('Course ID not found in server response');
      }

      setCreatedCourseId(newCourseId);
      setPublished(true);

      setTimeout(() => {
        router.push(`/lms/admin`);
      }, 2000);

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
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium';

  const card = 'bg-white rounded-3xl border border-slate-200 overflow-hidden mb-4 shadow-xs';
  const cardHead = 'flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50';
  const cardBody = 'p-6';
  const lbl = 'block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5';

  const iconBox = (bg: string, text: string) =>
    `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} ${text}`;

  // ── step bar ────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-xs">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 min-w-0">
          <button
            onClick={() => goTo(s.id)}
            className={`flex items-center justify-center gap-2 flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all min-w-0 cursor-pointer ${
              step === s.id
                ? 'bg-blue-600 text-white shadow-xs'
                : step > s.id
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
              step === s.id
                ? 'bg-white text-blue-600'
                : step > s.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.id ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
            </span>
            <span className="hidden md:inline whitespace-nowrap">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="w-px h-6 bg-slate-200 flex-shrink-0 mx-1" />
          )}
        </div>
      ))}
    </div>
  );

  // ── sidebar tips ───────────────────────────────────────────────
  const TipsCard = ({ tips }: { tips: string[] }) => (
    <div className={card}>
      <div className={cardHead}>
        <div className={iconBox('bg-amber-50', 'text-amber-600')}>
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Pro Tips</p>
        </div>
      </div>
      <div className={cardBody + ' space-y-3'}>
        {tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-slate-600 leading-relaxed">{t}</span>
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
    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-3 last:mb-0">
      <div className={iconBox(iconBg, iconText)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-700">{label}</span>
          <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">{val}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={1} value={val}
          onChange={e => setCriteria(valKey, Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
        />
      </div>
    </div>
  );

  // ── published screen ────────────────────────────────────────────
  if (published) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Course Created Successfully!</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your course <strong className="text-slate-900 font-bold">{formData.title}</strong> has been saved and is now ready on the platform.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href="/lms/admin"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Open Admin Catalog
            </Link>
            <Link
              href="/lms"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Back to LMS Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6 font-sans">

      {/* Top Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/lms/admin"
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse-glow" />
              Course Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create New Course</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Step {step} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl border border-red-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <StepBar />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        
        {/* Main Step Form Body */}
        <div className="space-y-4">
          
          {/* ── STEP 1: IDENTITY & GENERAL INFO ── */}
          {step === 1 && (
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-blue-50', 'text-blue-600')}><BookOpen className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Course Identity & Instructor</p>
                  <p className="text-xs text-slate-400">Essential course title, media, and faculty assignment</p>
                </div>
              </div>

              <div className={cardBody + ' space-y-4'}>
                
                {/* Title */}
                <div>
                  <label className={lbl}>Course Title <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => {
                      const val = e.target.value;
                      set('title', val);
                      if (!formData.slug) {
                        set('slug', val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }
                    }}
                    className={inputCls}
                    placeholder="e.g. Certified Ethical Hacker & Penetration Testing Track"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className={lbl}>
                    URL Slug <span className="text-[10px] text-slate-400 font-normal">(Auto-generated or custom URL path)</span>
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600">
                    <span className="text-slate-400 shrink-0">/courses/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-transparent border-0 outline-none w-full text-slate-800 font-bold ml-1"
                      placeholder="ethical-hacking-track"
                    />
                  </div>
                </div>

                {/* Instructor Selection Dropdown */}
                <div>
                  <label className={lbl}>
                    Lead Instructor <span className="text-[10px] text-slate-400 font-normal">(Select registered faculty)</span>
                  </label>
                  <select
                    value={formData.instructor}
                    onChange={e => handleInstructorChange(e.target.value)}
                    className={inputCls + ' cursor-pointer'}
                  >
                    <option value="">-- No Instructor Assigned --</option>
                    {instructors.map(inst => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} ({inst.role.toUpperCase()} • {inst.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thumbnail Upload & Options */}
                <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                  <CourseThumbnailUpload
                    value={formData.thumbnail}
                    onChange={url => set('thumbnail', url)}
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className={lbl}>Short Summary / Card Tagline</label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={e => set('shortDescription', e.target.value)}
                    className={inputCls}
                    placeholder="1-2 sentences highlighting the course outcome for catalog cards..."
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className={lbl}>Full Description <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => set('description', e.target.value)}
                    className={inputCls + ' resize-none'}
                    placeholder="Provide a comprehensive syllabus overview, prerequisites, and learning objectives..."
                  />
                </div>

                {/* Category & Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Category</label>
                    <select
                      value={formData.category}
                      onChange={e => set('category', e.target.value)}
                      className={inputCls + ' cursor-pointer'}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Difficulty Level</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {LEVELS.map(({ label, icon: Icon }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => set('level', label)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            formData.level === label
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 2: PRICING & SCHEDULE ── */}
          {step === 2 && (
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-emerald-50', 'text-emerald-600')}><DollarSign className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Pricing, Capacity & Schedule</p>
                  <p className="text-xs text-slate-400">Configure tuition fees, enrollment caps, and term dates</p>
                </div>
              </div>

              <div className={cardBody + ' space-y-5'}>
                
                {/* Course Type & Price */}
                <div>
                  <label className={lbl}>Course Tuition Model</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => { set('type', 'free'); set('price', 0); }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.type === 'free'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-sm">Free Course</div>
                      <div className="text-xs text-slate-500 mt-0.5">Open admission to all registered students</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => set('type', 'paid')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.type === 'paid'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-sm">Paid Pro Track</div>
                      <div className="text-xs text-slate-500 mt-0.5">Requires manual payment approval</div>
                    </button>
                  </div>

                  {formData.type === 'paid' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in-down">
                      <div>
                        <label className={lbl}>Tuition Fee Amount</label>
                        <input
                          type="number"
                          min={1}
                          value={formData.price}
                          onChange={e => set('price', Number(e.target.value))}
                          className={inputCls}
                          placeholder="e.g. 15000"
                        />
                      </div>
                      <div>
                        <label className={lbl}>Currency</label>
                        <input
                          type="text"
                          value={formData.currency}
                          onChange={e => set('currency', e.target.value.toUpperCase())}
                          className={inputCls}
                          placeholder="PKR"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Course Duration</label>
                    <select
                      value={formData.duration}
                      onChange={e => set('duration', e.target.value)}
                      className={inputCls + ' cursor-pointer'}
                    >
                      {DURATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Max Student Capacity (Optional)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.maxStudents}
                      onChange={e => set('maxStudents', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. 50 (Leave blank for unlimited)"
                    />
                  </div>
                </div>

                {/* Start & End Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => set('startDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={lbl}>End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => set('endDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className={lbl}>Topic Tags</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    className={inputCls}
                    placeholder="Type keyword and press Enter (e.g. linux, burpsuite, python)..."
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {formData.tags.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-200">
                          #{t}
                          <button type="button" onClick={() => removeTag(i)} className="text-blue-500 hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 3: REQUIREMENTS & OUTCOMES ── */}
          {step === 3 && (
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-purple-50', 'text-purple-600')}><ShieldCheck className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Certificate Requirements & Outcomes</p>
                  <p className="text-xs text-slate-400">Set passing standards and key takeaways</p>
                </div>
              </div>

              <div className={cardBody + ' space-y-6'}>
                
                {/* Requirements Sliders */}
                <div>
                  <label className={lbl}>Passing Thresholds to Earn Certificate</label>
                  <Slider
                    icon={CalendarCheck} iconBg="bg-blue-50" iconText="text-blue-600" barColor="bg-blue-500"
                    label="Minimum Session Attendance" valKey="minAttendancePercent" val={formData.completionCriteria.minAttendancePercent}
                  />
                  <Slider
                    icon={Pencil} iconBg="bg-emerald-50" iconText="text-emerald-600" barColor="bg-emerald-500"
                    label="Minimum Assignment Score" valKey="minAssignmentScore" val={formData.completionCriteria.minAssignmentScore}
                  />
                  <Slider
                    icon={HelpCircle} iconBg="bg-amber-50" iconText="text-amber-600" barColor="bg-amber-500"
                    label="Minimum Quiz Pass Rate" valKey="minQuizScore" val={formData.completionCriteria.minQuizScore}
                  />
                </div>

                {/* What You Will Learn */}
                <div>
                  <label className={lbl}>What You Will Learn (Key Takeaways)</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={learnInput}
                      onChange={e => setLearnInput(e.target.value)}
                      onKeyDown={addLearnItem}
                      className={inputCls}
                      placeholder="e.g. Master offensive security fundamentals and buffer overflows..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (learnInput.trim()) {
                          set('whatYouWillLearn', [...formData.whatYouWillLearn, learnInput.trim()]);
                          setLearnInput('');
                        }
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {formData.whatYouWillLearn.length > 0 ? (
                    <div className="space-y-2">
                      {formData.whatYouWillLearn.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                          <button type="button" onClick={() => removeLearnItem(i)} className="text-slate-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No key learning points added yet.</p>
                  )}
                </div>

                {/* Featured on Homepage Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Feature on Platform Homepage</span>
                    <span className="text-[11px] text-slate-500">Showcase this course in top highlights and banners</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => set('isFeatured', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 4: CURRICULUM MODULES ── */}
          {step === 4 && (
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-blue-50', 'text-blue-600')}><LayoutList className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Curriculum Modules</p>
                  <p className="text-xs text-slate-400">Outline the course structure into modules</p>
                </div>
              </div>

              <div className={cardBody + ' space-y-3'}>
                {formData.modules.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <input
                      type="text"
                      value={m}
                      onChange={e => updateModule(i, e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 min-w-0"
                      placeholder={`e.g. Module ${i + 1}: Core Concepts & Lab Setup...`}
                    />
                    <button
                      type="button"
                      onClick={() => deleteModule(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addModule}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all mt-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" /> Add New Module
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: REVIEW & PUBLISH ── */}
          {step === 5 && (
            <div className={card}>
              <div className={cardHead}>
                <div className={iconBox('bg-emerald-50', 'text-emerald-600')}><CheckCircle className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Review & Confirm</p>
                  <p className="text-xs text-slate-400">Review all details before publishing</p>
                </div>
              </div>

              <div className={cardBody + ' space-y-6'}>
                
                {/* Course Details Overview */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">General Information</p>
                  {[
                    ['Title', formData.title || 'Untitled'],
                    ['Slug', formData.slug ? `/courses/${formData.slug}` : 'Auto-generated'],
                    ['Instructor', formData.instructorName || 'Not assigned'],
                    ['Category', formData.category],
                    ['Difficulty Level', formData.level],
                    ['Tuition Model', formData.type === 'free' ? 'FREE' : `${formData.currency} ${formData.price.toLocaleString()}`],
                    ['Duration', formData.duration],
                    ['Start Date', fmtDate(formData.startDate) || 'Unscheduled'],
                    ['End Date', fmtDate(formData.endDate) || 'Unscheduled'],
                    ['Max Students', formData.maxStudents ? `${formData.maxStudents} students` : 'Unlimited'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-xs">
                      <span className="text-slate-500 font-medium">{k}</span>
                      <span className="font-bold text-slate-900 max-w-[240px] truncate text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Status Selection */}
                <div>
                  <label className={lbl}>Initial Publication Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => set('status', 'published')}
                      className={`p-3 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                        formData.status === 'published'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="font-extrabold">🚀 Live & Published</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">Students can browse & enroll</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => set('status', 'draft')}
                      className={`p-3 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                        formData.status === 'draft'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="font-extrabold">📝 Save as Draft</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">Hidden until you publish</div>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between items-center pt-2">
            {step === 1 ? (
              <Link
                href="/lms/admin"
                className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
              >
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader size="sm" /> Publishing Course...</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Publish Course Now</>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Live Sidebar Preview (Interactive) */}
        <div className="space-y-4">
          
          <div className={card}>
            <div className={cardHead}>
              <div className={iconBox('bg-blue-50', 'text-blue-600')}><Eye className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Live Preview Card</p>
                <p className="text-xs text-slate-400">Updates live as you type</p>
              </div>
            </div>

            <div className="p-4">
              
              {/* Preview Card Component */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm space-y-3">
                
                {/* Thumbnail Header */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                  {formData.thumbnail ? (
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100/60 flex flex-col items-center justify-center text-slate-700 p-4 relative select-none">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 mb-1">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Course Preview</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      formData.type === 'free' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {formData.type === 'free' ? 'FREE' : `${formData.currency} ${formData.price.toLocaleString()}`}
                    </span>
                    {formData.isFeatured && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200">
                      {formData.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 pt-1 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {formData.title || 'Your Course Title Here'}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {formData.shortDescription || formData.description || 'Add a clear description for prospective students.'}
                    </p>
                  </div>

                  {/* Instructor (Shown ONLY if selected/assigned) */}
                  {formData.instructorName ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {formData.instructorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">Instructor: <strong className="font-bold text-slate-800">{formData.instructorName}</strong></span>
                    </div>
                  ) : null}
                </div>

              </div>

            </div>
          </div>

          <TipsCard tips={[
            'Adding a custom thumbnail increases course enrollment by up to 60%',
            'Define clear, measurable outcomes in "What You Will Learn"',
            'You can easily attach video lectures after publishing using the Curriculum Builder',
          ]} />

        </div>

      </div>

    </div>
  );
}