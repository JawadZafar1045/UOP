"use client";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full px-3 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-0 transition-colors"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${i === 1 ? 'bg-blue-50/50' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-slate-800 text-sm">Design Team</h4>
                <span className="text-xs text-slate-400">10:42 AM</span>
              </div>
              <p className="text-sm text-slate-500 truncate">Here's the latest mockup for the dashboard.</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Design Team</h3>
            <p className="text-xs text-green-500 font-medium">4 online</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2.5 rounded-lg rounded-tl-none shadow-sm border border-slate-200 max-w-md">
              <p className="text-sm text-slate-800">Could someone review the CRM pipeline layout?</p>
              <p className="text-left text-[10px] text-slate-400 mt-1">10:35 AM</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-blue-600 px-4 py-2.5 rounded-lg rounded-tr-none shadow-sm text-white max-w-md">
              <p className="text-sm">Looks great! Just one minor tweak to the colors needed.</p>
              <p className="text-right text-[10px] text-blue-200 mt-1">10:42 AM</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 px-4 py-2.5 bg-slate-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:bg-white focus:ring-0 transition-colors"
            />
            <button className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
