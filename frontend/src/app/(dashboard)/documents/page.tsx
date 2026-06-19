"use client";

import { useState, useEffect } from "react";
import { getDocuments, uploadDocument, deleteDocument, downloadDocument } from "@/services/document.service";
import { useLmsStore } from "@/store/lmsStore";
import { useStore } from "@/store/useStore";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Loader from "@/components/ui/Loader";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadSubmitting, setIsUploadSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("policy");
  const [scope, setScope] = useState("institute");
  const [selectedCourse, setSelectedCourse] = useState("");
  
  const { courses, fetchCourses } = useLmsStore();
  const user = useStore(state => state.user);

  useEffect(() => {
    fetchCourses();
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("category", category);
    formData.append("scope", scope);
    if (scope === "course" && selectedCourse) {
      formData.append("courseId", selectedCourse);
    }

    setIsUploadSubmitting(true);
    try {
      await uploadDocument(formData);
      setIsUploading(false);
      setFile(null);
      setTitle("");
      loadDocuments();
    } catch (err) {
      console.error(err);
      alert("Failed to upload document.");
    } finally {
      setIsUploadSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      loadDocuments();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (id: string, fileName: string) => {
    try {
      await downloadDocument(id, fileName);
    } catch (err) {
      console.error(err);
      alert("Failed to download document.");
    }
  };

  const [activeTab, setActiveTab] = useState("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  
  const filteredDocuments = documents.filter(doc => {
    if (activeTab === "all") return true;
    if (doc.scope !== activeTab) return false;
    
    if (activeTab === "course" && selectedCourseFilter !== "all") {
      return doc.courseId?._id === selectedCourseFilter;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">


      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LMS Document Center</h1>
          <p className="text-sm text-slate-500 mt-1">Manage global institute files, course materials, and student submissions.</p>
        </div>
        {user?.role !== "student" && (
          <button 
            className="px-4 py-2 bg-blue-600 text-sm font-semibold text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
            onClick={() => setIsUploading(!isUploading)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload Document
          </button>
        )}
      </div>

      {/* Tabs Navigation & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex gap-8 overflow-x-auto w-full whitespace-nowrap scrollbar-hide pb-2">
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'institute', label: 'Institute Global' },
            { id: 'course', label: 'Course Materials' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedCourseFilter("all"); // Reset course filter when switching tabs
              }}
              className={`pb-4 text-sm font-semibold transition-all relative ${
                activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "course" && (
          <div className="pb-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Course:</span>
            <select 
              value={selectedCourseFilter} 
              onChange={e => setSelectedCourseFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            >
              <option value="all">All My Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Upload New Document</h3>
            <button onClick={() => setIsUploading(false)} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleUpload} className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Document Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="e.g. Annual Audit Report" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  <option value="policy">Policy</option>
                  <option value="contract">Contract</option>
                  <option value="report">Report</option>
                  <option value="material">Study Material</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Scope</label>
                <select value={scope} onChange={e => setScope(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  <option value="institute">Institute-wide (Global)</option>
                  <option value="course">Course Material</option>
                </select>
              </div>
              {scope === "course" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Course</label>
                  <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required>
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer group">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{file ? file.name : "Click to select or drag and drop file"}</span>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" required />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isUploadSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                {isUploadSubmitting ? <><Loader size="sm" /> Uploading...</> : 'Start Upload'}
              </button>
              <button type="button" onClick={() => setIsUploading(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">Document Info</th>
                <th className="px-6 py-5 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">Linking Scope</th>
                <th className="px-6 py-5 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">Uploaded By</th>
                <th className="px-6 py-5 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">Timestamp</th>
                <th className="px-6 py-5 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Synchronizing files...</p>
                  </div>
                </td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-400 font-medium italic">No documents found in this section</p>
                  </div>
                </td></tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{doc.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-2.5 py-1 text-[10px] font-black uppercase rounded-md border ${
                          doc.scope === 'institute' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          doc.scope === 'course' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {doc.scope}
                        </span>
                        {doc.courseId && <p className="text-[11px] font-medium text-slate-500">Course: {doc.courseId.title}</p>}
                        {doc.studentId && <p className="text-[11px] font-medium text-slate-500">Student: {doc.studentId.name}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                          {(doc.uploadedBy?.name || 'U')[0]}
                        </div>
                        <p className="text-sm font-medium text-slate-700">{doc.uploadedBy?.name || 'System'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleView(doc._id, doc.title || 'document')} 
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                        >
                          Download
                        </button>
                        {user?.role !== "student" && (
                          <button
                            onClick={() => handleDelete(doc._id)}
                            disabled={deletingId === doc._id}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            {deletingId === doc._id ? <><Loader size="sm" /> Deleting...</> : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
