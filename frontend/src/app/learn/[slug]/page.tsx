"use client";

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import * as lmsService from '@/services/lms.service';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Lock,
  BookOpen,
  Clock,
  Menu,
  X,
  Volume2,
  Settings,
  Sparkles,
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react';
import Loader from '@/components/ui/Loader';

export default function CourseLearningClassroom({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { user } = useStore();

  const [courseData, setCourseData] = useState<any>(null);
  const [currentLecture, setCurrentLecture] = useState<any>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);

  // Playback URL & Metadata
  const [playbackData, setPlaybackData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Video Ref & Progress Tracking
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedTimeRef = useRef(0);
  const [videoProgress, setVideoProgress] = useState(0); // 0–100 percent watched

  // Fetch full learning data
  useEffect(() => {
    if (!user) {
      router.push(`/login?returnUrl=/learn/${slug}`);
      return;
    }

    const fetchLearningData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await lmsService.getCourseLearningData(slug);
        setCourseData(data);

        // Find first lecture or most recently unwatched lecture
        let targetModIdx = 0;
        let targetLecIdx = 0;
        let found = false;

        for (let m = 0; m < (data.modules || []).length; m++) {
          const lecs = data.modules[m].lectures || [];
          for (let l = 0; l < lecs.length; l++) {
            if (!lecs[l].completed && !found) {
              targetModIdx = m;
              targetLecIdx = l;
              found = true;
              break;
            }
          }
          if (found) break;
        }

        const selected = data.modules?.[targetModIdx]?.lectures?.[targetLecIdx] || data.modules?.[0]?.lectures?.[0];
        setCurrentModuleIndex(targetModIdx);
        setCurrentLectureIndex(targetLecIdx);
        setCurrentLecture(selected);
      } catch (err: any) {
        setError(err?.message || 'Failed to load course classroom.');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [slug, user, router]);

  // When currentLecture changes, fetch authorized playback URL
  useEffect(() => {
    if (!courseData?._id || !currentLecture?._id) return;

    const fetchPlayback = async () => {
      setPlaybackLoading(true);
      try {
        const pb = await lmsService.getLecturePlayback(courseData._id, currentLecture._id);
        setPlaybackData(pb);

        // If video has previous progress, resume once loaded
        if (videoRef.current && pb.currentProgressSeconds > 0) {
          videoRef.current.currentTime = pb.currentProgressSeconds;
        }
      } catch (err: any) {
        console.error('Playback authorization error:', err);
      } finally {
        setPlaybackLoading(false);
      }
    };

    fetchPlayback();
  }, [courseData?._id, currentLecture?._id]);

  // Periodic progress saving function
  const saveProgress = async (isManualComplete = false) => {
    if (!courseData?._id || !currentLecture?._id) return;

    let currentTime = 0;
    let duration = 0;

    if (videoRef.current) {
      currentTime = Math.floor(videoRef.current.currentTime);
      duration = Math.floor(videoRef.current.duration || playbackData?.duration || 0);

      // Don't spam backend if time hasn't changed significantly (unless manual complete)
      if (!isManualComplete && Math.abs(currentTime - lastSavedTimeRef.current) < 10) {
        return;
      }
      lastSavedTimeRef.current = currentTime;
    } else {
      // YouTube iframe or external player
      duration = playbackData?.duration || currentLecture?.duration || 100;
      currentTime = isManualComplete ? duration : 0;
    }

    try {
      const updated = await lmsService.updateLectureProgress(
        courseData._id,
        currentLecture._id,
        isManualComplete ? (duration || 100) : currentTime,
        duration || 100
      );

      if (updated.completed) {
        // Update local state to show checkmark
        setCourseData((prev: any) => {
          if (!prev) return prev;
          const newMods = prev.modules.map((m: any) => ({
            ...m,
            lectures: m.lectures.map((l: any) =>
              l._id === currentLecture._id ? { ...l, completed: true } : l
            ),
          }));
          const completedCount = newMods.reduce((acc: number, m: any) =>
            acc + m.lectures.filter((l: any) => l.completed).length, 0
          );
          const overall = prev.totalLectures > 0
            ? Math.min(100, Math.round((completedCount / prev.totalLectures) * 100))
            : 0;

          return {
            ...prev,
            modules: newMods,
            completedLectures: completedCount,
            overallProgressPercent: overall,
          };
        });
      }
    } catch (saveErr) {
      console.warn('Could not save progress:', saveErr);
    }
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    // Track watched percentage for Mark Complete unlock
    if (duration > 0) {
      setVideoProgress(Math.round((currentTime / duration) * 100));
    }

    // Save every 20 seconds
    if (Math.abs(currentTime - lastSavedTimeRef.current) >= 20) {
      saveProgress(false);
    }

    // Auto-mark completed at >= 90%
    if (duration > 0 && (currentTime / duration) >= 0.90 && !currentLecture?.completed) {
      saveProgress(true);
    }
  };

  const selectLecture = (modIdx: number, lecIdx: number) => {
    // Save current lecture before switching
    saveProgress(false);

    const lec = courseData?.modules?.[modIdx]?.lectures?.[lecIdx];
    if (lec) {
      setCurrentModuleIndex(modIdx);
      setCurrentLectureIndex(lecIdx);
      setCurrentLecture(lec);
    }
  };

  const handleNextLecture = () => {
    const currentModule = courseData?.modules?.[currentModuleIndex];
    if (!currentModule) return;

    if (currentLectureIndex + 1 < currentModule.lectures.length) {
      selectLecture(currentModuleIndex, currentLectureIndex + 1);
    } else if (currentModuleIndex + 1 < courseData.modules.length) {
      selectLecture(currentModuleIndex + 1, 0);
    }
  };

  const handlePrevLecture = () => {
    if (currentLectureIndex > 0) {
      selectLecture(currentModuleIndex, currentLectureIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevModule = courseData?.modules?.[currentModuleIndex - 1];
      selectLecture(currentModuleIndex - 1, (prevModule?.lectures?.length || 1) - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader size="lg" text="Entering classroom..." />
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Classroom Access Error</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md mb-6">
          {error || 'The requested course classroom could not be found or requires enrollment.'}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
          >
            Course Details
          </Link>
          <Link
            href="/lms"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const hasLectures = courseData.totalLectures > 0 && (courseData.modules || []).some((m: any) => (m.lectures || []).length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Classroom Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/lms"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

          <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
            {courseData.title}
          </h1>
        </div>

        {/* Progress Bar & Toggle */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              {courseData.completedLectures} / {courseData.totalLectures} completed
            </span>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 rounded-full"
                style={{ width: `${courseData.overallProgressPercent || 0}%` }}
              />
            </div>
            <span className="text-xs font-black text-blue-400">
              {courseData.overallProgressPercent || 0}%
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Toggle Curriculum Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Classroom Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left/Center: Video Stage */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
          
          {/* Video Container Box */}
          <div className="w-full bg-black aspect-video max-h-[70vh] flex items-center justify-center relative shadow-2xl">
            {!hasLectures ? (
              <div className="text-center p-12 text-slate-300 max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Curriculum In Preparation</h3>
                <p className="text-xs text-slate-400">
                  Recorded lectures for this course are currently being uploaded by the CSZone instruction team.
                </p>
                {user?.role === 'admin' && (
                  <div className="pt-2">
                    <Link
                      href="/lms/admin"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <span>🛠️</span>
                      Add Modules & Upload Videos in Course Builder
                    </Link>
                  </div>
                )}
              </div>
            ) : playbackLoading ? (
              <Loader size="md" text="Loading video stream..." />
            ) : (() => {
              const streamUrl = playbackData?.playbackUrl || currentLecture?.contentUrl || currentLecture?.video?.playbackUrl || '';
              const isYouTube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be');

              if (isYouTube) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = streamUrl.match(regExp);
                const videoId = match && match[2].length === 11 ? match[2] : null;

                if (videoId) {
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`}
                      title={currentLecture?.title || 'Lecture Stream'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  );
                }
              }

              if (streamUrl) {
                return (
                  <video
                    ref={videoRef}
                    src={streamUrl}
                    controls
                    controlsList="nodownload"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => saveProgress(true)}
                    className="w-full h-full object-contain"
                    poster={courseData.thumbnail}
                  >
                    Your browser does not support video playback.
                  </video>
                );
              }

              return (
                <div className="text-center p-8 text-slate-400">
                  <Play className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-300">Video lecture stream ready</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentLecture?.description || 'Select a lecture from the curriculum sidebar to begin watching.'}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Lecture Info & Actions Under Video */}
          {currentLecture && (
            <div className="p-6 sm:p-8 space-y-6 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                    Module {currentModuleIndex + 1} • Lecture {currentLectureIndex + 1}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {currentLecture?.title || 'Lecture Overview'}
                  </h2>
                </div>

                {/* Prev / Next Nav */}
                {(() => {
                  // Compute boundary flags
                  const isFirstLecture = currentModuleIndex === 0 && currentLectureIndex === 0;
                  const lastModIdx = (courseData?.modules?.length || 1) - 1;
                  const lastLecIdx = ((courseData?.modules?.[lastModIdx]?.lectures?.length) || 1) - 1;
                  const isLastLecture = currentModuleIndex === lastModIdx && currentLectureIndex === lastLecIdx;

                  const streamUrl = playbackData?.playbackUrl || currentLecture?.contentUrl || currentLecture?.video?.playbackUrl || '';
                  const isYouTube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be');

                  // Mark Complete enabled if completed, if YouTube (no HTML5 progress events), or after watching >= 50%
                  const canMarkComplete = currentLecture?.completed || isYouTube || videoProgress >= 50;

                  return (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handlePrevLecture}
                        disabled={isFirstLecture}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                          isFirstLecture
                            ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                      </button>
                      <button
                        onClick={() => canMarkComplete && saveProgress(true)}
                        disabled={!canMarkComplete}
                        title={!canMarkComplete ? 'Watch at least 50% of the video to mark complete' : ''}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                          currentLecture?.completed
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 cursor-default'
                            : canMarkComplete
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {currentLecture?.completed ? 'Completed' : 'Mark Complete'}
                      </button>
                      <button
                        onClick={handleNextLecture}
                        disabled={isLastLecture}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                          isLastLecture
                            ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
                        }`}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Lecture Notes & Instructor Info */}
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <h3 className="text-base font-bold text-white">About this Lecture</h3>
                <p className="whitespace-pre-line text-slate-400">
                  {currentLecture?.description || 'No additional notes provided for this lecture.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Course Curriculum Tree */}
        <aside
          className={`w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-20 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Course Curriculum</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Module & Lecture Accordion */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {(courseData.modules || []).map((mod: any, mIdx: number) => {
              const lectures = mod.lectures || [];
              const isCurrentModule = mIdx === currentModuleIndex;

              return (
                <div key={mod._id || mIdx} className="bg-slate-900/60">
                  
                  {/* Module Header */}
                  <div className="p-3.5 bg-slate-900/90 font-bold text-xs text-slate-300 flex items-center justify-between">
                    <span className="truncate max-w-[240px]">
                      {mIdx + 1}. {mod.title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {lectures.filter((l: any) => l.completed).length}/{lectures.length}
                    </span>
                  </div>

                  {/* Lecture Items */}
                  <div className="divide-y divide-slate-800/40">
                    {lectures.map((lec: any, lIdx: number) => {
                      const isSelected = mIdx === currentModuleIndex && lIdx === currentLectureIndex;
                      const isDone = !!lec.completed;

                      return (
                        <button
                          key={lec._id || lIdx}
                          onClick={() => selectLecture(mIdx, lIdx)}
                          className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/20 text-blue-200 border-l-4 border-blue-500'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : isSelected ? (
                              <Play className="w-4 h-4 text-blue-400 fill-current shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                            )}

                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white font-bold' : ''}`}>
                                {lec.title}
                              </p>
                              <span className="text-[10px] text-slate-500">
                                {lec.duration > 0 ? `${Math.round(lec.duration / 60)} mins` : 'Video'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

        </aside>

      </div>

    </div>
  );
}
