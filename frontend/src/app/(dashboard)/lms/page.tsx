"use client";

import { useEffect } from 'react';
import { useLmsStore } from '@/store/lmsStore';
import { useStore } from '@/store/useStore';
import { Plus, PlayCircle, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LMSPage() {
  const { courses, isLoading, error, fetchCourses } = useLmsStore();
  const { user } = useStore();

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">LMS Courses</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isTeacherOrAdmin ? 'Manage educational material and enrollments.' : 'View and track your enrolled courses.'}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Link href="/lms/courses/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" />
              Create Course
            </button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100"></div>
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
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
          <p className="font-medium">{error}</p>
          <button onClick={() => fetchCourses()} className="mt-3 text-sm text-red-700 underline hover:text-red-800">
            Try again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No courses found</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            {isTeacherOrAdmin 
              ? "You haven't created any courses yet. Start by creating a new course."
              : "You are not enrolled in any courses at the moment."}
          </p>
          {isTeacherOrAdmin && (
            <Link href="/lms/courses/new">
              <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-all">
                <Plus className="w-4 h-4" />
                Create your first course
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link href={`/lms/courses/${course._id}`} key={course._id}>
              <div className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer h-full group">
                <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <PlayCircle className="w-10 h-10 text-slate-300" />
                  )}
                  {isTeacherOrAdmin && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[10px] font-bold tracking-widest uppercase text-slate-700 px-2.5 py-1 rounded-full shadow-sm">
                      {course.status}
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {course.status === 'active' && <span className="text-[10px] font-bold tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100">Live</span>}
                      {course.duration && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-lg leading-snug mb-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{course.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <div className="flex items-center text-slate-500">
                        <Users className="w-4 h-4 mr-1.5" />
                        <span className="font-medium text-xs">{course.enrolledStudents?.length || 0} Enrolled</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-800 transition-colors flex items-center gap-1">
                      {isTeacherOrAdmin ? 'Manage' : 'Go to Course'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
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
