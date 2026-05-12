"use client";

import { useEffect, useState, useMemo } from "react";
import { useLmsStore } from '@/store/lmsStore';
import { 
  BookOpen, Users, CheckCircle, FileEdit, BarChart3, PieChart,
  TrendingUp, DollarSign, UserCheck, ClipboardList
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
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const { courses, fetchCourses } = useLmsStore();
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Derive LMS stats
  const lmsStats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter(c => c.status === 'published' || c.status === 'active').length;
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
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const doughnutData = {
    labels: ['Published', 'Draft'],
    datasets: [
      {
        data: [lmsStats.published, lmsStats.draft],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '75%',
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1">Monitor your platform's performance and educational growth.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]">
            Export Data
          </button>
          <button className="px-4 py-2 bg-blue-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]">
            Platform Settings
          </button>
        </div>
      </div>

      {/* LMS KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{lmsStats.total}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1.5">LMS Courses</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{lmsStats.published}</p>
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
              <p className="text-2xl font-bold text-slate-900 leading-none">{lmsStats.enrolled}</p>
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1.5">Total Enrolled</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{lmsStats.draft}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1.5">Draft Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200/60 p-7 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Course Performance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Top 6 courses by enrollment</p>
            </div>
            <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg py-2 px-3 focus:ring-0 cursor-pointer">
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
              Content Health
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Publication status ratio</p>
          </div>
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
              <span className="text-sm font-bold text-emerald-700">{Math.round((lmsStats.published / (lmsStats.total || 1)) * 100)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-700">In Draft</span>
              </div>
              <span className="text-sm font-bold text-amber-700">{Math.round((lmsStats.draft / (lmsStats.total || 1)) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Platform Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Real-time updates</p>
          </div>
          <button className="text-sm font-bold text-blue-600 hover:text-blue-700">View All Log</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0 border border-blue-100/50">
                U{i}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  User {i} <span className="font-medium text-slate-500">enrolled in</span> Advanced React Architecture
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium italic">Just now</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
