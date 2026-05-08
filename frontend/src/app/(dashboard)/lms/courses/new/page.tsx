"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLmsStore } from '@/store/lmsStore';
import { BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

export default function NewCoursePage() {
  const router = useRouter();
  const { createCourse } = useLmsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    completionCriteria: {
      minAttendancePercent: 75,
      minAssignmentScore: 60,
      minQuizScore: 60
    },
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      // Direct API call since createCourse in store doesn't return the course ID directly easily without modifying the store signature
      const res = await api.post('/lms/courses', formData);
      router.push(`/lms/courses/${res.data?.data?._id || res.data?._id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to create course');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/lms" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Create New Course</h1>
          <p className="text-sm text-slate-500">Configure the details and requirements for your new course.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            General Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Title *</label>
              <input 
                required 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" 
                placeholder="e.g. Introduction to Advanced Mathematics" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                rows={4} 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" 
                placeholder="What will students learn in this course?" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={formData.endDate} 
                  onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Certificate Requirements
          </h2>
          <p className="text-sm text-slate-500 mb-6">Set the minimum requirements students must meet to earn a certificate.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Attendance (%)</label>
              <input 
                type="number" 
                min="0" max="100" 
                value={formData.completionCriteria.minAttendancePercent} 
                onChange={e => setFormData({...formData, completionCriteria: { ...formData.completionCriteria, minAttendancePercent: Number(e.target.value) }})} 
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Assignment Score (%)</label>
              <input 
                type="number" 
                min="0" max="100" 
                value={formData.completionCriteria.minAssignmentScore} 
                onChange={e => setFormData({...formData, completionCriteria: { ...formData.completionCriteria, minAssignmentScore: Number(e.target.value) }})} 
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. Quiz Score (%)</label>
              <input 
                type="number" 
                min="0" max="100" 
                value={formData.completionCriteria.minQuizScore} 
                onChange={e => setFormData({...formData, completionCriteria: { ...formData.completionCriteria, minQuizScore: Number(e.target.value) }})} 
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/lms" className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="px-6 py-2.5 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
