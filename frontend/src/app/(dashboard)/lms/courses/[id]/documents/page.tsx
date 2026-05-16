"use client";

import { useEffect, useState, useRef, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { 
  FileText, UploadCloud, XCircle, File, FileImage, FileVideo, 
  Eye, EyeOff, Trash2, Calendar 
} from 'lucide-react';
import Link from 'next/link';

export default function CourseDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { documents, isLoading, error, fetchDocuments, uploadDocument } = useLmsStore();
  const { user } = useStore();
  
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [visibleToStudents, setVisibleToStudents] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchDocuments(courseId);
  }, [courseId, fetchDocuments]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    setUploadProgress(10); // Fake progress to start

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('visibleToStudents', String(visibleToStudents));
      formData.append('file', file);

      // Simulate some progress
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 90));
      }, 500);

      await uploadDocument(courseId, formData);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      // Reset form
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setDescription('');
        setVisibleToStudents(true);
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to upload document');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <FileText className="w-8 h-8 text-slate-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('docx')) return <FileText className="w-8 h-8 text-blue-600" />;
    if (fileType.includes('video') || fileType.includes('mp4')) return <FileVideo className="w-8 h-8 text-purple-500" />;
    if (fileType.includes('image')) return <FileImage className="w-8 h-8 text-emerald-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter documents for students
  const displayDocs = isTeacherOrAdmin ? documents : documents.filter(d => d.visibleToStudents);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/lms/courses/${courseId}`} className="text-sm text-blue-600 hover:underline mb-2 block">&larr; Back to Course</Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Course Documents</h1>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      {/* Upload Section (Teachers Only) */}
      {isTeacherOrAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload New Material</h2>
          
          <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center h-full"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.png,.jpg,.jpeg"
              />
              <UploadCloud className="w-10 h-10 text-blue-500 mb-3" />
              {file ? (
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-900 mb-1">Click or drag file to this area to upload</p>
                  <p className="text-xs text-slate-500">Support for PDF, DOCX, PPTX, MP4, PNG, JPG.</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Title *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. Chapter 1 Slides" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Optional details..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="visibility" checked={visibleToStudents} onChange={e => setVisibleToStudents(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600" />
                <label htmlFor="visibility" className="text-sm font-medium text-slate-700">Visible to students immediately</label>
              </div>
              
              <button 
                type="submit" 
                disabled={!file || !title || isUploading} 
                className="w-full py-2.5 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isUploading ? (
                  <>Uploading {uploadProgress}%...</>
                ) : (
                  <>Upload Document</>
                )}
              </button>
              
              {isUploading && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900">Course Materials</h2>
        </div>
        
        {isLoading && documents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading documents...</div>
        ) : displayDocs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <File className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No documents shared yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {displayDocs.map((doc) => (
              <li key={doc._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={async () => {
                  try {
                    const { downloadCourseDocument } = await import('@/services/lms.service');
                    await downloadCourseDocument(doc._id, doc.title || 'document');
                  } catch (e) {
                    alert('Failed to download document.');
                  }
                }}>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getFileIcon(doc.fileType || '')}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm hover:text-blue-600 transition-colors">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{formatSize(doc.fileSize)}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(doc.createdAt).toLocaleDateString()}</span>
                      {!doc.visibleToStudents && isTeacherOrAdmin && (
                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isTeacherOrAdmin && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Toggle Visibility">
                      {doc.visibleToStudents ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
