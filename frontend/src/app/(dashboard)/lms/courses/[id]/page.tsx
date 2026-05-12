"use client";

import { useEffect, useState, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Calendar, Users, FileText, CheckCircle, BookOpen, Clock, FileBadge, UserPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import * as lmsService from '@/services/lms.service';

export default function CourseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { currentCourse, isLoading, error, fetchCourse } = useLmsStore();
  const { user } = useStore();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail) return;
    setIsEnrolling(true);
    try {
      await lmsService.enrollStudent(courseId, studentEmail);
      setShowEnrollModal(false);
      setStudentEmail('');
      fetchCourse(courseId);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to enroll student');
    } finally {
      setIsEnrolling(false);
    }
  };

  useEffect(() => {
    fetchCourse(courseId);
  }, [courseId, fetchCourse]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error || !currentCourse) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
        <p className="font-medium">{error || 'Course not found'}</p>
        <Link href="/lms" className="mt-3 text-sm text-red-700 underline hover:text-red-800">
          Back to Courses
        </Link>
      </div>
    );
  }

  const tabs = [
    { name: 'Sessions', icon: Calendar, href: `/lms/courses/${courseId}/sessions`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Assignments', icon: FileText, href: `/lms/courses/${courseId}/assignments`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Quizzes', icon: CheckCircle, href: `/lms/courses/${courseId}/quiz`, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Performance', icon: BookOpen, href: `/lms/courses/${courseId}/performance`, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {isTeacherOrAdmin && (
                <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase border ${
                  currentCourse.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                  currentCourse.status === 'draft' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-slate-700 bg-slate-100 border-slate-200'
                }`}>
                  {currentCourse.status}
                </span>
              )}
              {currentCourse.duration && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {currentCourse.duration}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{currentCourse.title}</h1>
            <p className="text-slate-600 max-w-2xl leading-relaxed">
              {currentCourse.description || 'No description provided for this course.'}
            </p>
            <div className="mt-4">
              {isTeacherOrAdmin && (
                <button 
                  onClick={() => setShowEnrollModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Enroll Student
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0 bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-sm min-w-[220px]">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Instructor</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold">
                {currentCourse.instructor?.name?.charAt(0) || 'I'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{currentCourse.instructor?.name || 'Unassigned'}</p>
                <p className="text-xs text-slate-500">{currentCourse.instructor?.email || ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{currentCourse.enrolledStudents?.length || 0}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isTeacherOrAdmin ? 'Students' : 'Learners'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{currentCourse.stats?.sessions || 0}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sessions</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{currentCourse.stats?.assignments || 0}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignments</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{currentCourse.stats?.quizzes || 0}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quizzes</p>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tabs.map((tab) => (
            <Link key={tab.name} href={tab.href}>
              <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col">
                <div className={`w-10 h-10 rounded-lg ${tab.bg} ${tab.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{tab.name}</h3>
                <p className="text-xs text-slate-500 mt-auto">
                  {isTeacherOrAdmin ? `Manage course ${tab.name.toLowerCase()}` : `View course ${tab.name.toLowerCase()}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Enroll Student</h2>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Email *</label>
                <input
                  required
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="Enter the student's email"
                />
                <p className="text-xs text-slate-500 mt-1">Provide the registered email address of the student.</p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
