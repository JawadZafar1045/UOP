"use client";

import { useState } from "react";

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'inbox'>('chat');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Communication Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Chat internal or email external contacts natively.</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('chat')}
          >
            Team Chat
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('inbox')}
          >
            Email Inbox
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="h-[calc(100vh-14rem)] flex bg-white rounded-xl border border-slate-200 elevation-1 overflow-hidden">
          {/* Chat Sidebar */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/30">
            <div className="p-4 border-b border-slate-200 shrink-0">
               <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${i === 1 ? 'bg-blue-50/50 border-blue-100' : 'hover:bg-slate-50'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold text-sm ${i===1?'text-blue-900':'text-slate-800'}`}>Sales Team Alpha</h4>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">10:42 AM</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">Here's the latest mockup for the dashboard.</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">SA</div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-none">Sales Team Alpha</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    4 members online
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-auto">JS</div>
                <div className="max-w-md">
                   <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-200">
                     <p className="text-sm text-slate-700 leading-relaxed">Could someone review the new CRM pipeline layout before we push it to presentation?</p>
                   </div>
                   <p className="text-[10px] font-medium text-slate-400 mt-1 ml-1">John S. • 10:35 AM</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <div className="max-w-md flex flex-col items-end">
                   <div className="bg-blue-600 px-4 py-3 rounded-2xl rounded-br-sm shadow-sm">
                     <p className="text-sm text-white leading-relaxed">Looks great! Just one minor tweak to the colors needed on the Kanban cards.</p>
                   </div>
                   <p className="text-[10px] font-medium text-slate-400 mt-1 mr-1">You • 10:42 AM</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors shrink-0">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <textarea 
                  placeholder="Reply to Sales Team Alpha..." 
                  className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none text-sm focus:ring-0 resize-none py-2"
                  rows={1}
                ></textarea>
                <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm shrink-0 mb-0.5">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 elevation-1 min-h-[500px] flex items-center justify-center p-6 text-center">
             <div>
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                   </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Email System Activated</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                   Your Nodemailer integration has been successfully set up. All outgoing template emails will log here directly from your <b>EmailLogs</b> collection.
                </p>
                <button className="mt-6 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all">
                  Compose Email
                </button>
             </div>
        </div>
      )}
    </div>
  );
}
