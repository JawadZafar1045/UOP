"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import * as lmsService from '@/services/lms.service';
import {
  BookOpen,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Clock3,
  X,
  Send,
  Loader2
} from 'lucide-react';
import Loader from '@/components/ui/Loader';
import { formatDuration } from '@/utils/formatDuration';

export default function CourseDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { user } = useStore();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Enrollment / Registration Status
  const [regStatus, setRegStatus] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [requestSuccessModalOpen, setRequestSuccessModalOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [registerNotes, setRegisterNotes] = useState('');
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  // Curriculum accordion state (all expanded by default or first expanded)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Free Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLecture, setPreviewLecture] = useState<any>(null);

  // Fetch course details & user enrollment status
  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await lmsService.getPublicCourseBySlug(slug);
        setCourse(data);

        // Expand first module by default
        if (data?.modules?.length > 0) {
          const initialExpanded: Record<string, boolean> = {};
          data.modules.forEach((m: any, idx: number) => {
            initialExpanded[m._id || idx] = idx === 0; // expand first module
          });
          setExpandedModules(initialExpanded);
        }

        // If user is logged in, fetch their registration/enrollment status
        if (user && data?._id) {
          try {
            const statusRes = await lmsService.getRegistrationStatus(data._id);
            setRegStatus(statusRes);
          } catch (statusErr) {
            console.warn('Could not fetch registration status:', statusErr);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Course not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [slug, user]);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Free enrollment handler
  const handleFreeEnroll = async () => {
    if (!user) {
      router.push(`/login?returnUrl=/courses/${slug}`);
      return;
    }
    setEnrolling(true);
    try {
      await lmsService.enrollFreeCourse(course._id);
      setRegStatus({ status: 'enrolled' });
      router.push(`/learn/${course.slug || course._id}`);
    } catch (err: any) {
      alert(err?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  // Paid course registration submission
  const handlePaidRegisterSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!user) {
      router.push(`/login?returnUrl=/courses/${slug}`);
      return;
    }
    setRegisterSubmitting(true);
    try {
      await lmsService.registerPaidCourse(course._id, {
        paymentReference: paymentRef,
        notes: registerNotes,
      });
      setRegisterModalOpen(false);
      setRegStatus({ status: 'pending' });
      setRequestSuccessModalOpen(true);
      setPaymentRef('');
      setRegisterNotes('');
    } catch (err: any) {
      alert(err?.message || 'Registration failed.');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Watch preview lecture
  const handleOpenPreview = (lecture: any) => {
    setPreviewLecture(lecture);
    setPreviewModalOpen(true);
  };

  // Wrapper: AppLayout for logged-in users, public layout for guests
  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    if (user) {
      return <AppLayout><div className="min-h-screen bg-[#f4f8fb] font-sans selection:bg-[#0E8696] selection:text-white">{children}</div></AppLayout>;
    }
    return (
      <div className="min-h-screen bg-[#f4f8fb] flex flex-col font-sans selection:bg-[#0E8696] selection:text-white">
        <PublicNavbar />
        <div className="flex-1">{children}</div>
        <PublicFooter />
      </div>
    );
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-40">
          <Loader size="lg" text="Loading course details..." />
        </div>
      </PageWrapper>
    );
  }

  if (error || !course) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#021F37]">Course Not Found</h2>
          <p className="text-[#4d6477] text-sm mt-2 mb-6">
            The course you are looking for might have been moved, removed, or is currently unpublished.
          </p>
          <Link
            href="/courses"
            className="px-6 py-3 bg-[#0b6f7c] text-white font-bold rounded-xl shadow-xs hover:bg-[#021F37] transition-all text-sm"
          >
            Browse All Courses
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const isTBC = course.type === 'paid' && (!course.price || Number(course.price) === 0);
  const isPaid = !isTBC && (course.type === 'paid' || (course.price && Number(course.price) > 0));
  const isFree = !isTBC && !isPaid;
  const hasValidDiscount = isPaid && (course?.hasDiscount || (Number(course?.discountPrice) > 0)) && Number(course?.discountPrice) > 0 && Number(course?.discountPrice) < Number(course?.price || 0);
  const discountPercent = course?.discountPercent || (hasValidDiscount && course?.price ? Math.round(((course.price - course.discountPrice) / course.price) * 100) : 0);
  const isEnrolled = regStatus?.status === 'enrolled';
  const isPending = regStatus?.status === 'pending';
  const isRejected = regStatus?.status === 'rejected';

  return (
    <PageWrapper>

      {/* Hero Header - Bright Executive Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-[#f4f8fb]/30 text-[#021F37] py-12 md:py-16 border-b border-[#d5e0e8]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d5e0e8_1px,transparent_1px),linear-gradient(to_bottom,#d5e0e8_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#eaf3f7]/60 blur-[100px] pointer-events-none rounded-full animate-blob" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* Left Header Content (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 animate-fade-in-down">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-xs ${
                    isPaid
                      ? (isEnrolled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-slate-900 text-white')
                      : (isEnrolled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-[#eaf3f7] text-[#021F37] border border-[#d5e0e8]')
                  }`}
                >
                  {isTBC ? 'FEE TO BE CONFIRMED' : isPaid
                    ? (isEnrolled ? 'PAID TRACK • ENROLLED' : '🔒 LOCKED • PAID COURSE')
                    : (isEnrolled ? 'FREE ACCESS • ENROLLED' : 'FREE COURSE')}
                </span>
                {course.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#021F37] border border-[#d5e0e8] shadow-xs">
                    {course.category}
                  </span>
                )}
                {course.level && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#021F37] border border-[#d5e0e8] shadow-xs">
                    {course.level}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#021F37] leading-tight animate-fade-in-up">
                {course.title}
              </h1>

              {/* Short Description */}
              <p className="text-base sm:text-lg text-[#4d6477] leading-relaxed font-normal animate-fade-in-up animation-delay-100">
                {course.shortDescription || course.description}
              </p>

              {/* Meta Info */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#4d6477] animate-fade-in-up animation-delay-200">
                {(course.instructor?.name || course.instructorName) && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0E8696]" />
                    <span>Instructor: <strong className="text-[#021F37] font-bold">{course.instructor?.name || course.instructorName}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0E8696]" />
                  <span>{course.moduleCount || (course.modules?.length || 0)} Modules • {course.lectureCount || 0} Lectures</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0E8696]" />
                    <span>{course.duration}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Mobile / Tablet Quick Price (on large screens sticky card is used) */}
            <div className="lg:hidden bg-white p-6 rounded-2xl border border-[#d5e0e8] text-[#021F37] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5f7587]">
                  {isFree ? 'Tuition' : 'Tuition'}
                </span>
                {hasValidDiscount ? (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black text-emerald-600">
                      {course.currency || 'PKR'} {Number(course.discountPrice).toLocaleString()}
                    </span>
                    <span className="text-sm text-[#5f7587] line-through font-semibold">
                      {course.currency || 'PKR'} {Number(course.price).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-black bg-emerald-100 text-emerald-800 rounded-md">
                      {discountPercent}% OFF
                    </span>
                  </div>
                ) : (
                  <span className={`text-2xl font-black ${isFree ? 'text-[#0E8696]' : 'text-[#021F37]'}`}>
                    {isTBC ? 'To be confirmed' : isFree ? 'FREE' : `${course.currency || 'PKR'} ${(course.price || 0).toLocaleString()}`}
                  </span>
                )}
              </div>
              {isEnrolled && (
                <div className="text-xs font-extrabold text-green-600 uppercase tracking-widest text-right">
                  ✓ Unlocked & Enrolled
                </div>
              )}
              {isEnrolled ? (
                <Link
                  href={`/learn/${course.slug || course._id}`}
                  className="w-full py-3.5 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white font-extrabold rounded-xl text-center block shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Continue Learning
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isPending ? (
                <div className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-xl text-center text-xs space-y-1">
                  <div className="flex items-center justify-center gap-1 font-extrabold">
                    <Clock3 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    Waiting for approval from admin
                  </div>
                  <p className="text-[10px] text-amber-700">An admin will contact you shortly to grant access.</p>
                </div>
              ) : isRejected ? (
                <div className="w-full p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-center text-xs space-y-2">
                  <div className="font-bold">❌ Registration Not Approved</div>
                  <button
                    onClick={() => user ? handlePaidRegisterSubmit() : router.push(`/login?returnUrl=/courses/${slug}`)}
                    disabled={registerSubmitting}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {registerSubmitting ? 'Submitting...' : 'Re-apply'}
                  </button>
                </div>
              ) : isFree ? (
                <button
                  onClick={handleFreeEnroll}
                  disabled={enrolling}
                  className="w-full py-3.5 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white font-extrabold rounded-xl text-center block shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {enrolling ? 'Enrolling...' : <>Enroll for Free <ArrowRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <button
                  onClick={() => user ? handlePaidRegisterSubmit() : router.push(`/login?returnUrl=/courses/${slug}`)}
                  disabled={registerSubmitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold rounded-xl text-center block shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {registerSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...</>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      Unlock Course / Register
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Main Content & Sticky Sidebar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column: Details, What You Learn, Curriculum */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Status Alert Banner (if user has an ongoing state) */}
            {isPending && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-4 shadow-xs">
                <Clock3 className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-bold text-base">Waiting for approval from admin</h4>
                  <p className="text-xs sm:text-sm text-amber-700 mt-1 leading-relaxed">
                    Your application has been received. An admin will contact you shortly to review your request and unlock full course access.
                  </p>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-4 shadow-xs">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-base">Registration Not Approved</h4>
                  <p className="text-xs sm:text-sm text-red-700 mt-1 leading-relaxed">
                    Reason: {regStatus?.rejectionReason || 'Verification requirements not met.'}
                  </p>
                  <button
                    onClick={() => setRegisterModalOpen(true)}
                    className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                  >
                    Re-apply with updated details
                  </button>
                </div>
              </div>
            )}

            {/* What You Will Learn Card */}
            {Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0 && (
              <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 sm:p-8 shadow-xs">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#021F37] tracking-tight mb-6 flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-[#0E8696] animate-pulse-glow" />
                  What You Will Learn
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.whatYouWillLearn.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#f4f8fb] text-[#0E8696] flex items-center justify-center shrink-0 mt-0.5 border border-[#eaf3f7]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm text-[#021F37] leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description */}
            <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#021F37] tracking-tight">
                Course Description
              </h2>
              <div className="text-[#4d6477] text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {course.description || course.shortDescription}
              </div>
            </div>

            {/* Course Curriculum Breakdown */}
            <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#021F37] tracking-tight">
                    Course Curriculum
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4d6477] mt-0.5">
                    {course.moduleCount} modules • {course.lectureCount} recorded video lectures
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#0E8696]">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Free Previews Available
                </div>
              </div>

              {/* Modules Accordion */}
              <div className="space-y-4">
                {(course.modules || []).map((mod: any, mIdx: number) => {
                  const modId = mod._id || mIdx;
                  const isExpanded = !!expandedModules[modId];
                  const lectures = mod.lectures || [];

                  return (
                    <div
                      key={modId}
                      className="border border-[#d5e0e8]/80 rounded-2xl overflow-hidden transition-all"
                    >
                      {/* Module Header Toggle */}
                      <button
                        onClick={() => toggleModule(modId)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 bg-[#f4f8fb]/80 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#f4f8fb] text-[#0b6f7c] border border-[#d5e0e8] font-black text-xs flex items-center justify-center shrink-0">
                            {mIdx + 1}
                          </span>
                          <div>
                            <h3 className="font-bold text-[#021F37] text-sm sm:text-base">
                              {mod.title}
                            </h3>
                            <span className="text-xs text-[#4d6477]">
                              {lectures.length} {lectures.length === 1 ? 'lecture' : 'lectures'}
                            </span>
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#5f7587]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#5f7587]" />
                        )}
                      </button>

                      {/* Lectures List */}
                      {isExpanded && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {lectures.map((lec: any, lIdx: number) => (
                            <div
                              key={lec._id || lIdx}
                              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-[#f4f8fb]/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="text-[#5f7587] text-xs font-mono shrink-0">
                                  {mIdx + 1}.{lIdx + 1}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-semibold text-[#021F37] truncate">
                                    {lec.title}
                                  </h4>
                                  {lec.description && (
                                    <p className="text-xs text-[#5f7587] truncate max-w-md">
                                      {lec.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-[#5f7587] font-medium">
                                  {lec.durationFormatted || (lec.duration ? formatDuration(lec.duration) : 'Video')}
                                </span>

                                {/* Preview Button or Lock Indicator */}
                                {lec.isPreview ? (
                                  <button
                                    onClick={() => handleOpenPreview(lec)}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-[#f4f8fb] hover:bg-[#eaf3f7] text-[#0b6f7c] font-bold text-xs rounded-lg transition-colors cursor-pointer border border-[#d5e0e8]"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    Free Preview
                                  </button>
                                ) : isEnrolled || (user && isFree) ? (
                                  <Link
                                    href={`/learn/${course.slug || course._id}`}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-[#f4f8fb] hover:bg-[#eaf3f7] text-[#0b6f7c] font-bold text-xs rounded-lg transition-colors border border-[#d5e0e8]"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    Watch Lecture
                                  </Link>
                                ) : (
                                  <div className="flex items-center gap-1 text-[#5f7587] text-xs font-medium bg-slate-100 px-2 py-1 rounded-md" title="Enroll to unlock">
                                    <Lock className="w-3 h-3 text-[#5f7587]" />
                                    <span>Locked</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructor Card (Shown only if assigned) */}
            {(course.instructor?.name || course.instructorName) && (
              <div className="bg-white rounded-3xl border border-[#d5e0e8]/80 p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#021F37] tracking-tight">
                  Instructor
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0E8696] text-white font-black text-xl flex items-center justify-center shadow-md">
                    {(course.instructor?.name || course.instructorName)?.charAt(0)?.toUpperCase() || 'I'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#021F37]">
                      {course.instructor?.name || course.instructorName}
                    </h3>
                    <p className="text-xs text-[#4d6477] font-medium">
                      {course.instructor?.bio || (course.instructor?.role ? `${course.instructor.role.toUpperCase()} • Lead Instructor` : 'Course Instructor')}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sticky Action Card (Desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-3xl border border-[#d5e0e8] shadow-xl overflow-hidden">
              
              {/* Card Thumbnail */}
              <div className="relative aspect-video w-full bg-slate-100 border-b border-[#d5e0e8]">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#f4f8fb] via-slate-50 to-[#eaf3f7]/60 flex flex-col items-center justify-center p-6 text-center text-[#021F37] relative select-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#d5e0e8_1px,transparent_1px),linear-gradient(to_bottom,#d5e0e8_1px,transparent_1px)] bg-[size:1.25rem_1.25rem] opacity-35" />
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#d5e0e8] shadow-xs flex items-center justify-center text-[#0E8696] mb-2 relative z-10">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#021F37] relative z-10">School of Information Security Platform</span>
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="p-6 space-y-6">
                <div className="bg-[#f4f8fb] border border-slate-100 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#5f7587]">
                      TUITION
                    </span>
                    {hasValidDiscount ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-3xl font-black text-emerald-600">
                            {course.currency || 'PKR'} {Number(course.discountPrice).toLocaleString()}
                          </span>
                          <span className="text-sm text-[#5f7587] line-through font-semibold">
                            {course.currency || 'PKR'} {Number(course.price).toLocaleString()}
                          </span>
                        </div>
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                          🎉 Save {course.currency || 'PKR'} {(Number(course.price) - Number(course.discountPrice)).toLocaleString()} ({discountPercent}% OFF)
                        </span>
                      </div>
                    ) : (
                      <span className={`text-3xl font-black tracking-tight ${isFree ? 'text-[#0E8696]' : 'text-[#021F37]'}`}>
                        {isTBC ? 'To be confirmed' : isFree ? 'FREE' : `${course.currency || 'PKR'} ${(course.price || 0).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                  {isEnrolled && (
                    <p className="text-right text-[11px] font-extrabold uppercase tracking-widest text-green-600 pt-1">
                      ✓ Unlocked & Enrolled
                    </p>
                  )}
                </div>

                {/* Main Action Button */}
                {isEnrolled ? (
                  <Link
                    href={`/learn/${course.slug || course._id}`}
                    className="w-full py-4 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white font-extrabold rounded-2xl shadow-md shadow-[#0E8696]/20 text-center block transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Continue Learning
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : isPending ? (
                  <div className="w-full py-3.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-2xl text-center text-xs space-y-1">
                    <div className="flex items-center justify-center gap-1.5 font-extrabold">
                      <Clock3 className="w-4 h-4 text-amber-600 animate-pulse" />
                      Waiting for approval from admin
                    </div>
                    <p className="text-[11px] text-amber-700">An admin will contact you shortly.</p>
                  </div>
                ) : isRejected ? (
                  <div className="w-full p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-center text-xs space-y-2">
                    <div className="flex items-center justify-center gap-1.5 font-extrabold text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      Registration Not Approved
                    </div>
                    {regStatus?.rejectionReason && (
                      <p className="text-[11px] text-red-700 bg-white/80 p-2 rounded-xl border border-red-100 text-left">
                        <strong>Reason:</strong> {regStatus.rejectionReason}
                      </p>
                    )}
                    <button
                      onClick={() => setRegisterModalOpen(true)}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Re-apply with Updated Info
                    </button>
                  </div>
                ) : isFree ? (
                  <button
                    onClick={handleFreeEnroll}
                    disabled={enrolling}
                    className="w-full py-4 bg-[#0E8696] hover:bg-[#0b6f7c] active:scale-95 text-white font-extrabold rounded-2xl shadow-md shadow-[#0E8696]/20 text-center block transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Enrolling...</>
                    ) : (
                      <>Enroll for Free <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => user ? handlePaidRegisterSubmit() : router.push(`/login?returnUrl=/courses/${slug}`)}
                    disabled={registerSubmitting}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-slate-900/20 text-center block transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {registerSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin text-[#0b4a66]" /> Submitting Request...</>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        Unlock Course / Register
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {/* Guarantee / Benefits */}
                <div className="space-y-3 pt-5 border-t border-slate-100 text-xs text-[#4d6477]">
                  <div className="flex items-center gap-3 font-semibold text-[#021F37] bg-[#f4f8fb]/80 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8696] shrink-0" />
                    <span>Instant access to all modules after enrollment</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-[#021F37] bg-[#f4f8fb]/80 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8696] shrink-0" />
                    <span>Watch recorded video lectures at your own pace</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-[#021F37] bg-[#f4f8fb]/80 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#0E8696] shrink-0" />
                    <span>Track video progress & lecture completions</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Paid Registration Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#d5e0e8] shadow-2xl max-w-lg w-full p-6 sm:p-8 relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-[#5f7587] hover:text-[#4d6477] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0E8696]">Course Application</span>
              <h3 className="text-2xl font-black text-[#021F37]">Register for {course.title}</h3>
              <p className="text-xs sm:text-sm text-[#4d6477]">
                Tuition: <strong className="text-[#021F37] font-bold">{course.currency} {(course.price || 0).toLocaleString()}</strong>.
                Submit your registration for manual review by the School of Information Security admissions team.
              </p>
            </div>

            <form onSubmit={handlePaidRegisterSubmit} className="space-y-4">
              
              {/* Payment Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider">
                  Payment / Transfer Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. Bank Transfer ID, Receipt #, or EasyPaisa/JazzCash ref"
                  className="w-full px-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                />
                <p className="text-[11px] text-[#5f7587]">
                  If you have already submitted fee payment to the School of Information Security, include your reference number here to expedite approval.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#021F37] uppercase tracking-wider">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={registerNotes}
                  onChange={(e) => setRegisterNotes(e.target.value)}
                  placeholder="Any background details or message for the instructor..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#f4f8fb] border border-[#d5e0e8] rounded-xl text-sm text-[#021F37] focus:outline-none focus:ring-2 focus:ring-[#0E8696]/20 focus:border-[#0E8696]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-5 py-2.5 text-[#4d6477] font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerSubmitting}
                  className="px-6 py-2.5 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {registerSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Registration <Send className="w-4 h-4" /></>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Free Preview Video Modal */}
      {previewModalOpen && previewLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-3xl w-full p-6 text-white relative animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f4f8fb] text-[#0b6f7c] text-xs font-bold uppercase tracking-wider border border-[#d5e0e8]">
                  Free Preview
                </span>
                <h3 className="font-bold text-lg text-white truncate max-w-lg">
                  {previewLecture.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 text-[#5f7587] hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
              {previewLecture.previewUrl ? (() => {
                const streamUrl = previewLecture.previewUrl;
                const isYouTube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be');

                if (isYouTube) {
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                  const match = streamUrl.match(regExp);
                  const videoId = match && match[2].length === 11 ? match[2] : null;

                  if (videoId) {
                    return (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                        title={previewLecture.title || 'Lecture Stream'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    );
                  }
                }

                return (
                  <video
                    src={streamUrl}
                    controls
                    autoPlay
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support HTML video playback.
                  </video>
                );
              })() : (
                <div className="text-center p-8 text-[#5f7587]">
                  <Play className="w-12 h-12 text-[#4d6477] mx-auto mb-2" />
                  <p className="text-sm font-semibold">Video stream will be available shortly.</p>
                </div>
              )}
            </div>

            {previewLecture.description && (
              <p className="mt-4 text-xs text-[#5f7587] leading-relaxed">
                {previewLecture.description}
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-[#5f7587]">
                Full course includes <strong>{course.lectureCount} lectures</strong>.
              </span>
              <button
                onClick={() => {
                  setPreviewModalOpen(false);
                  if (isFree) handleFreeEnroll();
                  else if (user) setRegisterModalOpen(true);
                  else router.push(`/login?returnUrl=/courses/${slug}`);
                }}
                className="px-5 py-2 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                {isFree ? 'Enroll for Full Course' : 'Register for Full Track'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Registration Request Success Modal */}
      {requestSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#d5e0e8] shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-center space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Animated Glow Checkmark Icon */}
            <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-green-500 to-[#0E8696] text-white flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Request Sent to Admin
              </span>
              <h3 className="text-2xl font-black text-[#021F37]">
                Application Submitted!
              </h3>
              <p className="text-sm text-[#4d6477] leading-relaxed">
                Your enrollment request has been delivered to the <strong className="text-[#021F37] font-bold">Admin</strong>. An admin will contact you shortly to review your request. Once verified, full course access will be unlocked.
              </p>
            </div>

            {/* Application Details Summary */}
            <div className="bg-[#f4f8fb] border border-[#d5e0e8]/80 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-[#4d6477]">
                <span>Course:</span>
                <strong className="text-[#021F37] font-bold max-w-[200px] truncate">{course.title}</strong>
              </div>
              <div className="flex justify-between items-center text-[#4d6477]">
                <span>Tuition:</span>
                <strong className="text-[#021F37] font-bold">{course.currency} {(course.price || 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-[#4d6477] border-t border-[#d5e0e8]/60 pt-2">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                  <Clock3 className="w-3 h-3 text-amber-600 animate-pulse" /> Waiting for approval from admin
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setRequestSuccessModalOpen(false)}
                className="w-full py-3.5 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#0E8696]/20 transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
