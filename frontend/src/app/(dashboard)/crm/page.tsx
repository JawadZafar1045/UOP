"use client";

import { useState } from "react";

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
          <button className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all elevation-1">
            + New Lead
          </button>
        </div>
      </div>

      {activeView === 'pipeline' ? (
        <div className="grid grid-cols-4 gap-5 h-[calc(100vh-14rem)] overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage);
            return (
              <div key={stage} className="bg-slate-100/60 rounded-xl border border-slate-200/60 flex flex-col min-w-[280px]">
                <div className="p-4 border-b border-slate-200/60 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-sm">{stage}</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 elevation-1 hover:elevation-2 transition-shadow cursor-grab">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-semibold text-slate-900 text-sm">{lead.name}</p>
                        <button className="text-slate-400 hover:text-slate-600">•••</button>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">{lead.company}</p>
                      <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded w-max">
                        {lead.value}
                      </div>
                    </div>
                  ))}
                  {/* Empty state placeholder for columns */}
                  {stageLeads.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-400">No leads</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 elevation-1 overflow-hidden">
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
