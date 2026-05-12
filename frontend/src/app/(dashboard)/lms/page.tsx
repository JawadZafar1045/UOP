"use client";

import { useEffect } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { 
  Plus, PlayCircle, BookOpen, Users, ArrowRight, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function LMSPage() {
  const { courses, isLoading, error, fetchCourses } = useLmsStore();
  const { user } = useStore();

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LMS Courses</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">
            {isTeacherOrAdmin ? 'Manage educational material and enrollments.' : 'View and track your enrolled courses.'}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Link href="/lms/courses/new">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
              <Plus className="w-4.5 h-4.5" />
              Create Course
            </button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse shadow-sm">
              <div className="h-48 bg-slate-100"></div>
              <div className="p-6">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50/50 text-red-600 p-8 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="font-semibold text-lg">{error}</p>
          <button onClick={() => fetchCourses()} className="mt-4 text-sm font-medium text-red-700 bg-red-100/50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
            Try again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses yet</h3>
          <p className="text-slate-500 text-base max-w-sm leading-relaxed">
            {isTeacherOrAdmin 
              ? "Your educational journey starts here. Create your first course and share your knowledge."
              : "You haven't enrolled in any courses yet. Explore our catalog to get started."}
          </p>
          {isTeacherOrAdmin && (
            <Link href="/lms/courses/new">
              <button className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                <Plus className="w-5 h-5" />
                Create Course
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link href={`/lms/courses/${course._id}`} key={course._id} className="group">
              <div className="bg-white rounded-2xl border border-slate-200/60 hover:border-blue-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col h-full relative">
                {/* Thumbnail Area */}
                <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-blue-200 group-hover:text-blue-300 transition-colors duration-300" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md border ${
                      course.status === 'published' || course.status === 'active'
                        ? 'bg-emerald-500/90 text-white border-emerald-400' 
                        : 'bg-slate-700/90 text-white border-slate-600'
                    }`}>
                      {course.status === 'active' ? 'PUBLISHED' : course.status?.toUpperCase() || 'DRAFT'}
                    </span>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl leading-snug mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {course.title}
                    </h3>
                    <p className="text-[15px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {course.description || 'No description provided. Start learning today with this comprehensive course.'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-xs">{course.enrolledStudents?.length || 0} Enrolled</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-blue-600 font-bold text-sm group/btn">
                      <span>{isTeacherOrAdmin ? 'Manage' : 'Go to Course'}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
