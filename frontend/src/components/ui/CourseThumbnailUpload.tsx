'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  Link as LinkIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  FileImage,
  ExternalLink
} from 'lucide-react';
import * as lmsService from '@/services/lms.service';

interface CourseThumbnailUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

const PRESET_THUMBNAILS = [
  { label: 'Cyber Security', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Web Dev', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cloud & DevOps', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
  { label: 'AI & Data', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mobile Apps', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80' },
  { label: 'UI/UX Design', url: 'https://images.unsplash.com/photo-1581291518655-9523c932dedb?auto=format&fit=crop&w=800&q=80' },
];

export default function CourseThumbnailUpload({
  value = '',
  onChange,
  className = '',
}: CourseThumbnailUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(value);

  // Sync internal urlInput state if value changes externally
  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG, GIF).');
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Image size exceeds 20MB. Please choose a smaller file.');
      return;
    }

    setUploadError(null);
    setSelectedFileName(file.name);
    setIsUploading(true);

    try {
      // Read local base64 preview first for immediate instant display
      const base64Preview = await fileToBase64(file);
      onChange(base64Preview);

      // Attempt server upload
      const formData = new FormData();
      formData.append('thumbnail', file);

      try {
        const res = await lmsService.uploadThumbnail(formData);
        if (res?.url) {
          onChange(res.url);
        }
      } catch (serverErr: any) {
        console.warn('[CourseThumbnailUpload] Server upload warning:', serverErr);
        const serverMsg = serverErr?.response?.data?.message || serverErr?.message || '';
        if (serverMsg.includes('Route not found') || serverErr?.response?.status === 404) {
          setUploadError('Backend server restart needed for Cloudinary storage. Image saved locally for now.');
        } else {
          setUploadError(serverMsg || 'Image loaded from local file.');
        }
      }
    } catch (err: any) {
      console.error('[CourseThumbnailUpload] File read error:', err);
      setUploadError(err?.message || 'Failed to read image from local folder.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset file input value so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  }, []);

  const handleRemove = () => {
    onChange('');
    setSelectedFileName(null);
    setUploadError(null);
    setUrlInput('');
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUploadError(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif, image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Header / Label with Action */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileImage className="w-4 h-4 text-blue-600" />
          Course Thumbnail Image
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Image
          </button>
        )}
      </div>

      {/* When an image is selected/uploaded, show a rich preview card */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm group">
          <div className="aspect-video sm:h-52 w-full relative bg-slate-950 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Course Thumbnail"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
              {selectedFileName && (
                <span className="text-[10px] text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md truncate max-w-[200px]">
                  {selectedFileName}
                </span>
              )}
            </div>

            {/* Action Bar inside Preview */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-800 font-bold text-xs rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    Choose from Local Folder
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                {value.startsWith('http') && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
                    title="Open full image"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: File Dropzone & Option Tabs */
        <div className="space-y-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              Upload from Computer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Presets
            </button>
          </div>

          {/* TAB 1: Upload from Computer / Folder (Primary Dropzone) */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/80 scale-[1.01] ring-4 ring-blue-100'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30'
              } ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center animate-bounce">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Reading and processing image...</p>
                    <p className="text-xs text-slate-500 mt-0.5">Please wait a moment.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-3 space-y-3">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose image from your <span className="text-blue-600 underline">Local Folder</span> or drag & drop
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports JPG, PNG, WEBP, SVG, GIF (up to 20MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Browse Files from PC
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Image URL Input */}
          {activeTab === 'url' && (
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Direct Image Link</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select a Curated Cover:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_THUMBNAILS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                      setUploadError(null);
                    }}
                    className="p-2 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error / Status Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
