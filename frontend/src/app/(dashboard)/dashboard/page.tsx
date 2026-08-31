"use client";

import { useEffect, useState, useMemo } from "react";
import { useLmsStore } from '@/store/lmsStore';
import { 
  BookOpen, Users, CheckCircle, FileEdit, BarChart3, PieChart,
  TrendingUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  DoughnutController,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Link from 'next/link';
import * as dashboardService from '@/services/dashboard.service';
import { useStore } from "@/store/useStore";
import Loader from "@/components/ui/Loader";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  DoughnutController
);

export default function DashboardPage() {
  const { user } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const { courses, fetchCourses } = useLmsStore();

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchCourses();
    
    const loadDashboardData = async () => {
      try {
        const statsData = await dashboardService.getDashboardStats();
        setStats(statsData);
        
        if (isTeacherOrAdmin) {
          const activitiesData = await dashboardService.getActivities();
          setActivities(activitiesData || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [fetchCourses, isTeacherOrAdmin]);

  // Derive LMS stats for charts (Admin/Teacher view)
  const lmsStats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter(c => c.status === 'active').length;
    const draft = courses.filter(c => c.status === 'draft').length;
    const enrolled = courses.reduce((acc, curr) => acc + (curr.enrolledStudents?.length || 0), 0);
    
    return { total, published, draft, enrolled };
  }, [courses]);

  // Chart Data
  const barChartData = {
    labels: courses.slice(0, 6).map(c => c.title.length > 12 ? c.title.substring(0, 12) + '...' : c.title),
    datasets: [
      {
        label: 'Enrolled',
        data: courses.slice(0, 6).map(c => c.enrolledStudents?.length || 0),
        backgroundColor: '#4F46E5', // Beautiful deep indigo
        hoverBackgroundColor: '#6366F1', // Light indigo on hover
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const doughnutData = {
    labels: ['Published', 'Draft'],
    datasets: [
      {
        data: [lmsStats.published, lmsStats.draft],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 12,
        titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter, sans-serif', size: 12 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F1F5F9',
          lineWidth: 1,
        },
        border: {
          dash: [5, 5],
          display: false,
        },
        ticks: {
          precision: 0,
          stepSize: 1,
          color: '#94A3B8',
          font: { family: 'Inter, sans-serif', size: 11, weight: '500' }
        }
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#94A3B8',
          font: { family: 'Inter, sans-serif', size: 11, weight: '500' }
        }
      },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 12,
        titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter, sans-serif', size: 12 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
  };

  if (isStatsLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isTeacherOrAdmin ? "Overview" : "Student Dashboard"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isTeacherOrAdmin 
              ? "Monitor your platform's performance and educational growth." 
              : `Welcome back, ${user?.name || 'Student'}! Track your learning progress.`}
          </p>
        </div>
      </div>

      {/* Role-Based KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isTeacherOrAdmin ? (
          <>
            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{stats?.stats?.courses || lmsStats.total}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1.5">LMS Majors</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{stats?.stats?.active || lmsStats.published}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">Live Content</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{stats?.stats?.students || lmsStats.enrolled}</p>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1.5">Students</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">+{Math.round(lmsStats.published * 1.5)}</p>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1.5">Growth Index</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{stats?.stats?.enrolled || 0}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1.5">Enrolled</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{stats?.stats?.completed || 0}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">75%</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1.5">Avg Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{stats?.stats?.certificates || 0}</p>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1.5">Certificates</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analytics Row — Show only for Teachers/Admins */}
      {isTeacherOrAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-slate-200/60 p-7 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500 shrink-0" />
                  Major Performance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Top 6 majors by enrollment</p>
              </div>
              <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg py-2 px-3 focus:ring-0 cursor-pointer w-full sm:w-auto">
                <option>Top Enrolled</option>
                <option>Recently Added</option>
              </select>
            </div>
            <div className="h-[300px]">
              {courses.length > 0 ? (
                <Bar data={barChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No data available</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 p-7 rounded-3xl shadow-sm">
            <div className="mb-8">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-500" />
                Published Majors
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Publication status ratio</p>
            </div>
            {lmsStats.total === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center gap-3">
                <PieChart className="w-10 h-10 text-slate-200" />
                <p className="text-sm font-medium text-slate-400">No majors created yet</p>
              </div>
            ) : (
              <>
                <div className="h-[240px] flex items-center justify-center">
                  <div className="w-full max-w-[200px] relative">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-1">
                      <span className="text-3xl font-bold text-slate-900 leading-none">{lmsStats.published}</span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight mt-0.5">Live</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">Published</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">{Math.round((lmsStats.published / lmsStats.total) * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-700">In Draft</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">{Math.round((lmsStats.draft / lmsStats.total) * 100)}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Student View — Continue Learning */}
      {!isTeacherOrAdmin && (
        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">Continue Learning</h3>
              <p className="text-sm text-slate-500 mt-1">Pick up right where you left off</p>
            </div>
            <Link href="/lms" className="text-sm font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap">View All Majors</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.slice(0, 4).map((course) => (
              <Link key={course._id} href={`/lms/courses/${course._id}`} className="group">
                <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <BookOpen className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{course.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{course.description || 'No description available'}</p>
                    <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Student Directory — Show only for Teachers/Admins */}
      {isTeacherOrAdmin && stats?.recentStudents?.length > 0 && (
        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">Active Students</h3>
              <p className="text-sm text-slate-500 mt-1">Directory of students across all courses</p>
            </div>
            <div className="flex -space-x-2">
              {stats.recentStudents.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm overflow-hidden">
                  {s.avatar ? <img src={s.avatar} alt="" className="w-full h-full object-cover" /> : s.name[0]}
                </div>
              ))}
              {stats.recentStudents.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm">
                  +{stats.recentStudents.length - 5}
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentStudents.map((student: any) => (
                <div key={student._id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-4 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 overflow-hidden">
                    {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full object-cover" /> : student.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{student.name}</h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{student.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Student</span>
                      <span className="text-[10px] text-slate-400 font-medium italic">Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Section — Show only if there are activities and user is teacher/admin */}
      {isTeacherOrAdmin && activities.length > 0 && (
        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Platform Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Real-time updates</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((act) => (
              <div key={act._id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 border border-blue-100/50 overflow-hidden">
                  {act.userId?.avatar ? (
                    <img src={act.userId.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (act.userId?.name?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-snug">
                    {act.userId?.name || 'User'} <span className="font-medium text-slate-500 italic lowercase">{act.action.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{new Date(act.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
