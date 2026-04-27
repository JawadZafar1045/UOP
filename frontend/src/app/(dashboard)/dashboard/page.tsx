"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Mock data to prevent hard dependency on seeded API during development
        setStats({
          leads: { total: 124, new: 12, conversionRate: '36.2%' },
          revenue: { total: '$14,200', growth: '+8.4%' },
          students: { total: 850, active: 420 },
          tasks: { pending: 18 }
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-medium text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-all">
            Download Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all elevation-1">
            New Campaign
          </button>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 elevation-1">
            <h3 className="text-slate-500 font-medium text-xs tracking-wider uppercase mb-1">Total Leads</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-slate-900">{stats.leads.total}</p>
              <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                ↑ {stats.leads.new} this week
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 elevation-1">
            <h3 className="text-slate-500 font-medium text-xs tracking-wider uppercase mb-1">Pipeline Revenue</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-slate-900">{stats.revenue.total}</p>
              <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {stats.revenue.growth}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 elevation-1">
            <h3 className="text-slate-500 font-medium text-xs tracking-wider uppercase mb-1">Active Students</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-slate-900">{stats.students.active}</p>
              <p className="text-xs text-slate-400">/ {stats.students.total} total</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 elevation-1">
            <h3 className="text-slate-500 font-medium text-xs tracking-wider uppercase mb-1">Pending Tasks</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-slate-900">{stats.tasks.pending}</p>
              <div className="flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                Requires action
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 elevation-1 flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-900">Conversion Analytics</h3>
            <select className="text-sm border-none bg-slate-50 rounded-md py-1 px-2 text-slate-600 font-medium focus:ring-0 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center bg-slate-50/50">
            <p className="text-sm font-medium text-slate-400">[Chart Area - Ready for Recharts/Chart.js integration]</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 elevation-1 flex flex-col h-96">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  U
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    User {i} updated lead status
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
