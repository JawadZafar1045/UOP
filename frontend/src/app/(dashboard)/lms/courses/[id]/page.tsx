"use client";

import { useEffect, use } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { Calendar, Users, FileText, CheckCircle, BookOpen, Clock, FileBadge } from 'lucide-react';
import Link from 'next/link';

export default function CourseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { currentCourse, isLoading, error, fetchCourse } = useLmsStore();

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
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase border ${
                currentCourse.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                currentCourse.status === 'draft' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                'text-slate-700 bg-slate-100 border-slate-200'
              }`}>
                {currentCourse.status}
              </span>
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
          </div>
          
          <div className="flex-shrink-0 bg-slate-50 rounded-xl p-4 border border-slate-100 min-w-[200px]">
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
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Students</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">--</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sessions</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">--</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignments</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">--</p>
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
                <p className="text-xs text-slate-500 mt-auto">Manage course {tab.name.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
