"use client";

export default function LMSPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">LMS Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage educational material and enrollments.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all elevation-1">
          + Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((course) => (
          <div key={course} className="bg-white rounded-xl border border-slate-200 elevation-1 hover:elevation-2 transition-shadow overflow-hidden flex flex-col cursor-pointer">
            <div className="h-40 bg-slate-100 flex items-center justify-center relative">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[10px] font-bold tracking-widest uppercase text-slate-700 px-2.5 py-1 rounded-full shadow-sm">
                Active
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">Development</span>
                  <span className="text-xs text-slate-400 font-medium">8 Weeks</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-lg leading-snug mb-2">Advanced React Patterns</h3>
                <p className="text-sm text-slate-600 line-clamp-2">Learn advanced patterns and performance optimization techniques for modern React applications.</p>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="flex -space-x-2 mr-3">
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200"></div>
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-300"></div>
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center text-[10px] text-white font-bold">+5</div>
                  </div>
                  <span className="text-slate-500 font-medium text-xs">42 Enrolled</span>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
