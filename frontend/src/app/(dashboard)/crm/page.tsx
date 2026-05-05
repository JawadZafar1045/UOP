"use client";

import { useState } from "react";
import { Briefcase } from "lucide-react";

const STAGES = ['Inquiry', 'Follow-up', 'Converted', 'Enrolled'];

export default function CRMPage() {
  const [activeView, setActiveView] = useState<'pipeline' | 'list'>('pipeline');

  const leads = [
    { id: 1, name: "Alice Johnson", company: "TechCorp", stage: "Inquiry", value: "$4,500" },
    { id: 2, name: "Bob Smith", company: "DevStudio", stage: "Follow-up", value: "$1,200" },
    { id: 3, name: "Charlie Davis", company: "AgencyX", stage: "Converted", value: "$8,900" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">CRM Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Manage business leads and opportunities.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveView('pipeline')}
            >
              Pipeline
            </button>
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveView('list')}
            >
              List
            </button>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all shadow-md">
            + New Lead
          </button>
        </div>
      </div>

      {activeView === 'pipeline' ? (
        <div className="flex gap-6 h-[calc(100vh-16rem)] overflow-x-auto pb-6 px-1 custom-scrollbar">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="flex-1 min-w-[320px] max-w-[400px] bg-slate-50/60 rounded-[2rem] border border-slate-200/60 flex flex-col shadow-sm">
                <div className="p-5 border-b border-slate-200/60 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">{stage}</h3>
                  </div>
                  <span className="bg-white text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200/50 shadow-sm">
                    {stageLeads.length}
                  </span>
                </div>
                
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {stageLeads.map(lead => (
                    <div 
                      key={lead.id} 
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-grab group active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{lead.name}</p>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors p-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </button>
                      </div>
                      <p className="text-xs font-medium text-slate-400 mb-4 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" /> {lead.company}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                          {lead.value}
                        </div>
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                            {lead.name.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {stageLeads.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200/80 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 bg-slate-100/30">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No Leads</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">alice@example.com</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{lead.company}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{lead.value}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800">Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
