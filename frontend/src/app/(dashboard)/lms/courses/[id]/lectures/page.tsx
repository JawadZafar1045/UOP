"use client";

import { useEffect, useState, useMemo, useRef, use } from "react";
import { useStore } from "@/store/useStore";
import { useLmsStore } from "@/store/lmsStore";
import * as lmsService from "@/services/lms.service";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Search,
  FileText,
  Check,
  Film,
  Layers,
  HelpCircle,
  X,
  Share2,
  SlidersHorizontal,
} from "lucide-react";

interface ResourceItem {
  title: string;
  url: string;
  type?: string;
}

interface VideoLecture {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  moduleName?: string;
  videoUrl: string;
  youtubeVideoId?: string;
  durationMinutes?: number;
  order?: number;
  notes?: string;
  resources?: ResourceItem[];
  isPublished?: boolean;
  isCompleted?: boolean;
  completedCount?: number;
  createdAt?: string;
}

function extractYouTubeId(url: string): string {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}

export default function CourseVideoLecturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { user } = useStore();
  const { currentCourse, fetchCourse } = useLmsStore();

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  const [lectures, setLectures] = useState<VideoLecture[]>([]);
  const [activeLecture, setActiveLecture] = useState<VideoLecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [layoutMode, setLayoutMode] = useState<"top" | "side">("top");
  const playlistScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lecture_playlist_layout");
      if (saved === "top" || saved === "side") {
        setLayoutMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLayoutChange = (mode: "top" | "side") => {
    setLayoutMode(mode);
    try {
      localStorage.setItem("lecture_playlist_layout", mode);
    } catch {
      // ignore
    }
  };

  const scrollPlaylist = (direction: "left" | "right") => {
    if (playlistScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      playlistScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<VideoLecture | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingProgress, setIsTogglingProgress] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    moduleName: "",
    durationMinutes: 15,
    description: "",
    notes: "",
    isPublished: true,
    resources: [] as ResourceItem[],
  });

  const [newResource, setNewResource] = useState({ title: "", url: "" });

  const loadLectures = async () => {
    try {
      setIsLoading(true);
      const res = await lmsService.getVideoLectures(courseId);
      const data: VideoLecture[] = Array.isArray(res) ? res : res?.data || [];
      setLectures(data);
      if (data.length > 0) {
        // If activeLecture exists in new list, maintain it; otherwise select first
        setActiveLecture((prev) => {
          if (!prev) return data[0];
          const found = data.find((l) => l._id === prev._id);
          return found || data[0];
        });
      } else {
        setActiveLecture(null);
      }
    } catch (err) {
      console.error("Failed to load video lectures:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse(courseId);
    loadLectures();
  }, [courseId]);

  // Modules list for filtering
  const modulesList = useMemo(() => {
    const mods = new Set<string>();
    lectures.forEach((l) => {
      if (l.moduleName) mods.add(l.moduleName);
    });
    return ["All", ...Array.from(mods)];
  }, [lectures]);

  // Filtered lectures
  const filteredLectures = useMemo(() => {
    return lectures.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.moduleName && l.moduleName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesModule = selectedModule === "All" || l.moduleName === selectedModule;
      return matchesSearch && matchesModule;
    });
  }, [lectures, searchQuery, selectedModule]);

  // Active lecture index and navigation
  const activeIndex = useMemo(() => {
    if (!activeLecture) return -1;
    return filteredLectures.findIndex((l) => l._id === activeLecture._id);
  }, [activeLecture, filteredLectures]);

  const handleNextLecture = () => {
    if (activeIndex >= 0 && activeIndex < filteredLectures.length - 1) {
      setActiveLecture(filteredLectures[activeIndex + 1]);
    }
  };

  const handlePrevLecture = () => {
    if (activeIndex > 0) {
      setActiveLecture(filteredLectures[activeIndex - 1]);
    }
  };

  // Progress Toggle
  const handleToggleProgress = async () => {
    if (!activeLecture || isTogglingProgress) return;
    setIsTogglingProgress(true);
    try {
      const res = await lmsService.toggleVideoLectureProgress(courseId, activeLecture._id);
      const newStatus = res?.isCompleted ?? !activeLecture.isCompleted;
      
      setLectures((prev) =>
        prev.map((l) =>
          l._id === activeLecture._id ? { ...l, isCompleted: newStatus } : l
        )
      );
      setActiveLecture((prev) => (prev ? { ...prev, isCompleted: newStatus } : null));
    } catch (err: any) {
      alert(err?.message || "Failed to update lecture progress");
    } finally {
      setIsTogglingProgress(false);
    }
  };

  // Open Create/Edit Modal
  const handleOpenCreateModal = () => {
    setEditingLecture(null);
    setFormData({
      title: "",
      videoUrl: "",
      moduleName: "Module 1",
      durationMinutes: 20,
      description: "",
      notes: "",
      isPublished: true,
      resources: [],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (lec: VideoLecture, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLecture(lec);
    setFormData({
      title: lec.title,
      videoUrl: lec.videoUrl,
      moduleName: lec.moduleName || "General",
      durationMinutes: lec.durationMinutes || 15,
      description: lec.description || "",
      notes: lec.notes || "",
      isPublished: lec.isPublished !== false,
      resources: lec.resources || [],
    });
    setShowModal(true);
  };

  const handleDeleteLecture = async (lecId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this video lecture?")) return;
    try {
      await lmsService.deleteVideoLecture(courseId, lecId);
      await loadLectures();
    } catch (err: any) {
      alert(err?.message || "Failed to delete video lecture");
    }
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl) {
      alert("Please provide lecture title and video URL.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingLecture) {
        await lmsService.updateVideoLecture(courseId, editingLecture._id, formData);
      } else {
        await lmsService.createVideoLecture(courseId, formData);
      }
      setShowModal(false);
      await loadLectures();
    } catch (err: any) {
      alert(err?.message || "Failed to save video lecture");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddResource = () => {
    if (!newResource.title || !newResource.url) return;
    setFormData((prev) => ({
      ...prev,
      resources: [...prev.resources, { title: newResource.title, url: newResource.url, type: "link" }],
    }));
    setNewResource({ title: "", url: "" });
  };

  const handleRemoveResource = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  // Computed Progress
  const completedLecturesCount = lectures.filter((l) => l.isCompleted).length;
  const progressPercent = lectures.length > 0 ? Math.round((completedLecturesCount / lectures.length) * 100) : 0;
  const totalDurationMinutes = lectures.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  // Active Lecture Embed URL
  const activeYtId = activeLecture ? activeLecture.youtubeVideoId || extractYouTubeId(activeLecture.videoUrl) : "";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link
              href={`/lms/courses/${courseId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-green-700 transition-all group active:scale-[0.98] shadow-green-500/20"
            >
              <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
              Back to Course
            </Link>

            {isTeacherOrAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Video Lecture
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {currentCourse?.title ? `${currentCourse.title} - Video Lectures` : "Course Video Lectures"}
              </h1>
              <p className="text-slate-500 mt-1 text-[15px]">
                Watch video lectures, tutorials, and track your learning progress.
              </p>
            </div>

            {/* Clean Stats Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold shadow-sm">
                <Film className="w-4 h-4 text-green-600" />
                <span>{lectures.length} Lectures</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold shadow-sm">
                <Clock className="w-4 h-4 text-green-600" />
                <span>{totalDurationMinutes} mins</span>
              </div>
              {!isTeacherOrAdmin && lectures.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{progressPercent}% Done</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader size="lg" text="Loading video lectures..." />
          </div>
        ) : lectures.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4 shadow-inner">
              <Video className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Video Lectures Added Yet</h3>
            <p className="text-slate-500 text-sm max-w-md mb-6">
              {isTeacherOrAdmin
                ? "Upload or embed your first YouTube video lecture (listed or unlisted) for this course to help students study visually."
                : "Your instructor hasn't uploaded any video lectures for this major yet. Check back soon!"}
            </p>
            {isTeacherOrAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add First Video Lecture
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {layoutMode === "top" ? (
              /* ======================================================== */
              /* TOP ROW PLAYLIST LAYOUT (Playlist Above Video Player)     */
              /* ======================================================== */
              <div className="space-y-6">
                {/* Top Row Playlist Box */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                  {/* Header Bar: Title, Search, Layout Switch & Scroll Arrows */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-bold shadow-inner">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                          Course Playlist
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-bold border border-green-100">
                            {filteredLectures.length} of {lectures.length}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Select any lecture below to play • Showing row format above video
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search input */}
                      <div className="relative min-w-[200px] sm:min-w-[240px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search lectures or topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Layout Setting Toggle */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                        <button
                          onClick={() => handleLayoutChange("top")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            (layoutMode as string) === "top"
                              ? "bg-white text-green-600 shadow-sm font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                          title="Row Layout (Above Video)"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Top Row</span>
                        </button>
                        <button
                          onClick={() => handleLayoutChange("side")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            (layoutMode as string) === "side"
                              ? "bg-white text-green-600 shadow-sm font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                          title="Sidebar Layout (Right Column)"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Sidebar</span>
                        </button>
                      </div>

                      {/* Row Navigation Arrows */}
                      <div className="hidden sm:flex items-center gap-1">
                        <button
                          onClick={() => scrollPlaylist("left")}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all shadow-sm"
                          title="Scroll Left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollPlaylist("right")}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all shadow-sm"
                          title="Scroll Right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module Filter Pills */}
                  {modulesList.length > 2 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {modulesList.map((mod) => (
                        <button
                          key={mod}
                          onClick={() => setSelectedModule(mod)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            selectedModule === mod
                              ? "bg-green-600 text-white shadow-sm font-bold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {mod}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Horizontal Scrollable Row of Video Cards */}
                  {filteredLectures.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-medium">
                      No lectures match your search or filter.
                    </div>
                  ) : (
                    <div
                      ref={playlistScrollRef}
                      className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200"
                    >
                      {filteredLectures.map((lec, idx) => {
                        const isActive = activeLecture?._id === lec._id;
                        const ytId = lec.youtubeVideoId || extractYouTubeId(lec.videoUrl);
                        const thumbnail = ytId
                          ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                          : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=60";

                        return (
                          <div
                            key={lec._id}
                            onClick={() => setActiveLecture(lec)}
                            className={`group relative w-72 sm:w-80 shrink-0 p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isActive
                                ? "bg-green-50/70 border-green-300 ring-2 ring-green-500/30 shadow-md -translate-y-0.5"
                                : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm"
                            }`}
                          >
                            <div>
                              {/* Thumbnail */}
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center">
                                <img
                                  src={thumbnail}
                                  alt={lec.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform ${
                                      isActive
                                        ? "bg-green-600 text-white scale-110 shadow-lg"
                                        : "bg-black/50 text-white group-hover:scale-110"
                                    }`}
                                  >
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  </div>
                                </div>

                                {/* Duration Badge */}
                                {lec.durationMinutes ? (
                                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                    {lec.durationMinutes}m
                                  </span>
                                ) : null}

                                {/* Active Playing Badge */}
                                {isActive && (
                                  <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                    Now Playing
                                  </span>
                                )}
                              </div>

                              {/* Metadata */}
                              <div className="mt-3">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-tight">
                                  <span>#{idx + 1}</span>
                                  <span>•</span>
                                  <span className="truncate">{lec.moduleName || "General"}</span>
                                </div>
                                <h4
                                  className={`text-xs font-bold mt-1 line-clamp-2 transition-colors ${
                                    isActive ? "text-green-950 font-extrabold" : "text-slate-800 group-hover:text-green-600"
                                  }`}
                                >
                                  {lec.title}
                                </h4>
                              </div>
                            </div>

                            {/* Status Footer */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                              {lec.isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Check className="w-3 h-3" /> Watched
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  Not watched
                                </span>
                              )}

                              {isTeacherOrAdmin && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => handleOpenEditModal(lec, e)}
                                    className="p-1 text-slate-500 hover:text-green-600 rounded"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteLecture(lec._id, e)}
                                    className="p-1 text-slate-500 hover:text-red-600 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Video Player & Active Lecture Details */}
                {activeLecture ? (
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden transition-all">
                    {/* Video Player Container (16:9 Aspect Ratio) */}
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {activeYtId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${activeYtId}?rel=0&modestbranding=1&enablejsapi=1`}
                          title={activeLecture.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full border-0"
                        ></iframe>
                      ) : activeLecture.videoUrl.endsWith(".mp4") || activeLecture.videoUrl.includes("commondatastorage") ? (
                        <video
                          controls
                          className="w-full h-full object-contain"
                          src={activeLecture.videoUrl}
                          poster={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80`}
                        >
                          Your browser does not support HTML5 video.
                        </video>
                      ) : (
                        <div className="p-8 text-center text-white space-y-4">
                          <Play className="w-16 h-16 text-green-400 mx-auto opacity-80" />
                          <p className="text-sm font-semibold">{activeLecture.title}</p>
                          <a
                            href={activeLecture.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-md"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Video in New Tab
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Player Controls Bar */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevLecture}
                          disabled={activeIndex <= 0}
                          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                        >
                          ◀ Previous
                        </button>
                        <button
                          onClick={handleNextLecture}
                          disabled={activeIndex >= filteredLectures.length - 1}
                          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                        >
                          Next ▶
                        </button>
                      </div>

                      {!isTeacherOrAdmin && (
                        <button
                          onClick={handleToggleProgress}
                          disabled={isTogglingProgress}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${
                            activeLecture.isCompleted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-green-600 text-white hover:bg-green-700 shadow-green-500/20"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {activeLecture.isCompleted ? "Completed ✓" : "Mark as Completed"}
                        </button>
                      )}

                      {isTeacherOrAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleOpenEditModal(activeLecture, e)}
                            className="p-2 text-slate-600 hover:text-green-600 bg-white border border-slate-200 rounded-xl hover:bg-green-50 transition-all"
                            title="Edit Video Lecture"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteLecture(activeLecture._id, e)}
                            className="p-2 text-slate-600 hover:text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 transition-all"
                            title="Delete Video Lecture"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lecture Details & Description */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-lg border border-green-200">
                            {activeLecture.moduleName || "General Topic"}
                          </span>
                          {activeLecture.durationMinutes ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              {activeLecture.durationMinutes} minutes
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          {activeLecture.title}
                        </h2>
                        {activeLecture.description && (
                          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                            {activeLecture.description}
                          </p>
                        )}
                      </div>

                      {/* Lecture Notes Section */}
                      {activeLecture.notes && (
                        <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <BookOpen className="w-4 h-4 text-amber-700" />
                            Key Lecture Notes & Takeaways
                          </h4>
                          <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                            {activeLecture.notes}
                          </div>
                        </div>
                      )}

                      {/* Supplementary Resources */}
                      {activeLecture.resources && activeLecture.resources.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-green-600" />
                            Lecture Materials & Downloads
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeLecture.resources.map((res, idx) => (
                              <a
                                key={idx}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-xl transition-all group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-green-600 shrink-0" />
                                  <span className="text-sm font-semibold text-slate-800 group-hover:text-green-600 truncate">
                                    {res.title}
                                  </span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-green-600 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* ======================================================== */
              /* SIDEBAR PLAYLIST LAYOUT (Side-by-side)                    */
              /* ======================================================== */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Player & Active Lecture Details (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  {activeLecture ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden transition-all">
                      {/* Video Player Container (16:9 Aspect Ratio) */}
                      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {activeYtId ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${activeYtId}?rel=0&modestbranding=1&enablejsapi=1`}
                            title={activeLecture.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full border-0"
                          ></iframe>
                        ) : activeLecture.videoUrl.endsWith(".mp4") || activeLecture.videoUrl.includes("commondatastorage") ? (
                          <video
                            controls
                            className="w-full h-full object-contain"
                            src={activeLecture.videoUrl}
                            poster={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80`}
                          >
                            Your browser does not support HTML5 video.
                          </video>
                        ) : (
                          <div className="p-8 text-center text-white space-y-4">
                            <Play className="w-16 h-16 text-green-400 mx-auto opacity-80" />
                            <p className="text-sm font-semibold">{activeLecture.title}</p>
                            <a
                              href={activeLecture.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-md"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open Video in New Tab
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Player Controls Bar */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrevLecture}
                            disabled={activeIndex <= 0}
                            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                          >
                            ◀ Previous
                          </button>
                          <button
                            onClick={handleNextLecture}
                            disabled={activeIndex >= filteredLectures.length - 1}
                            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                          >
                            Next ▶
                          </button>
                        </div>

                        {!isTeacherOrAdmin && (
                          <button
                            onClick={handleToggleProgress}
                            disabled={isTogglingProgress}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${
                              activeLecture.isCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-green-600 text-white hover:bg-green-700 shadow-green-500/20"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {activeLecture.isCompleted ? "Completed ✓" : "Mark as Completed"}
                          </button>
                        )}

                        {isTeacherOrAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleOpenEditModal(activeLecture, e)}
                              className="p-2 text-slate-600 hover:text-green-600 bg-white border border-slate-200 rounded-xl hover:bg-green-50 transition-all"
                              title="Edit Video Lecture"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteLecture(activeLecture._id, e)}
                              className="p-2 text-slate-600 hover:text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 transition-all"
                              title="Delete Video Lecture"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lecture Details & Description */}
                      <div className="p-6 sm:p-8 space-y-6">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-lg border border-green-200">
                              {activeLecture.moduleName || "General Topic"}
                            </span>
                            {activeLecture.durationMinutes ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                <Clock className="w-3.5 h-3.5" />
                                {activeLecture.durationMinutes} minutes
                              </span>
                            ) : null}
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                            {activeLecture.title}
                          </h2>
                          {activeLecture.description && (
                            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                              {activeLecture.description}
                            </p>
                          )}
                        </div>

                        {/* Lecture Notes Section */}
                        {activeLecture.notes && (
                          <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <BookOpen className="w-4 h-4 text-amber-700" />
                              Key Lecture Notes & Takeaways
                            </h4>
                            <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                              {activeLecture.notes}
                            </div>
                          </div>
                        )}

                        {/* Supplementary Resources */}
                        {activeLecture.resources && activeLecture.resources.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-green-600" />
                              Lecture Materials & Downloads
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeLecture.resources.map((res, idx) => (
                                <a
                                  key={idx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-xl transition-all group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-green-600 shrink-0" />
                                    <span className="text-sm font-semibold text-slate-800 group-hover:text-green-600 truncate">
                                      {res.title}
                                    </span>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-green-600 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right Column: Lecture Playlist & Module List (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-6">
                    {/* Playlist Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <Layers className="w-5 h-5 text-green-600" />
                          Course Playlist
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {filteredLectures.length} of {lectures.length} lectures
                        </p>
                      </div>

                      {/* Layout switch button in sidebar */}
                      <button
                        onClick={() => handleLayoutChange("top")}
                        className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-slate-200"
                        title="Switch to Top Row Layout (Above Video)"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search lectures or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    {/* Module Pill Filter */}
                    {modulesList.length > 2 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {modulesList.map((mod) => (
                          <button
                            key={mod}
                            onClick={() => setSelectedModule(mod)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                              selectedModule === mod
                                ? "bg-green-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {mod}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Lecture Playlist Items */}
                    <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                      {filteredLectures.map((lec, idx) => {
                        const isActive = activeLecture?._id === lec._id;
                        const ytId = lec.youtubeVideoId || extractYouTubeId(lec.videoUrl);
                        const thumbnail = ytId
                          ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                          : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=60";

                        return (
                          <div
                            key={lec._id}
                            onClick={() => setActiveLecture(lec)}
                            className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center ${
                              isActive
                                ? "bg-green-50/70 border-green-300 ring-2 ring-green-500/20 shadow-sm"
                                : "bg-white hover:bg-slate-50 border-slate-200/80"
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center">
                              <img
                                src={thumbnail}
                                alt={lec.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                <Play className={`w-5 h-5 ${isActive ? "text-green-400" : "text-white"}`} />
                              </div>
                              {lec.durationMinutes ? (
                                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 rounded">
                                  {lec.durationMinutes}m
                                </span>
                              ) : null}
                            </div>

                            {/* Title & Metadata */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-tight">
                                <span>#{idx + 1}</span>
                                <span>•</span>
                                <span className="truncate">{lec.moduleName || "General"}</span>
                              </div>
                              <h4
                                className={`text-xs font-bold mt-0.5 line-clamp-1 transition-colors ${
                                  isActive ? "text-green-950 font-bold" : "text-slate-800 group-hover:text-green-600"
                                }`}
                              >
                                {lec.title}
                              </h4>

                              {/* Completion indicator */}
                              <div className="mt-1.5 flex items-center gap-1.5">
                                {lec.isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                    <Check className="w-3 h-3" /> Watched
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">
                                    Not watched
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Video Lecture Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-green-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-green-200" />
                  <h3 className="font-bold text-lg">
                    {editingLecture ? "Edit Video Lecture" : "Add New Video Lecture"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveLecture} className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Lecture Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Introduction to Integrated Pest Management"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Module / Section Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Module 1: Crop Ecology"
                      value={formData.moduleName}
                      onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="20"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    YouTube URL or Video Link *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ (Listed / Unlisted links supported)"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  {formData.videoUrl && extractYouTubeId(formData.videoUrl) && (
                    <div className="mt-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(formData.videoUrl)}/default.jpg`}
                        alt="Preview"
                        className="w-14 h-10 object-cover rounded-lg"
                      />
                      <div className="text-xs text-emerald-800">
                        <span className="font-bold">✓ YouTube Video Detected!</span>
                        <p className="text-[11px] text-emerald-600 font-mono mt-0.5">ID: {extractYouTubeId(formData.videoUrl)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Lecture Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of what is covered in this video lecture..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Study Notes / Key Summary
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add bullet points or key takeaways for students to study alongside the video..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  ></textarea>
                </div>

                {/* Resource Links */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Supplementary Resources / Handouts (Optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Resource Title (e.g. Lecture Slides PDF)"
                      value={newResource.title}
                      onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="URL (https://...)"
                      value={newResource.url}
                      onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddResource}
                      className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black"
                    >
                      Add
                    </button>
                  </div>

                  {formData.resources.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {formData.resources.map((res, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-100 rounded-lg text-xs">
                          <span className="font-semibold text-slate-800">{res.title}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveResource(i)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg shadow-green-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isSaving ? "Saving..." : editingLecture ? "Update Lecture" : "Save & Publish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
