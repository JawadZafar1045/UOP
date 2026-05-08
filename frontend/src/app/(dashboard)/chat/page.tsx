"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import * as lmsService from "@/services/lms.service";
import { Search, MessageSquare, BookOpen } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  instructor: {
    name: string;
  };
}

export default function ChatPage() {
  const { user } = useStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await lmsService.getCourses();
        setCourses(data.courses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">My Course Discussions</h1>
          <p className="text-slate-500">Select a course to see discussion details. (Messaging feature currently disabled)</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search your courses..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:bg-white focus:ring-0 transition-all shadow-sm"
          />
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Courses Found</h3>
            <p className="text-sm text-slate-500 max-w-xs">You are not enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div 
                key={course._id} 
                className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{course.title}</h4>
                <p className="text-xs text-slate-500 mb-4">Instructor: {course.instructor.name}</p>
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Discussion Group</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
