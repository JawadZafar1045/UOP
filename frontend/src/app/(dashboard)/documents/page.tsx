"use client";

import { useState } from "react";

export default function DocumentsPage() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Document Center</h1>
          <p className="text-sm text-slate-500 mt-1">Upload, track, and manage company policies and contracts.</p>
        </div>
        <button 
          className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all elevation-1 flex items-center gap-2"
          onClick={() => setIsUploading(!isUploading)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Document
        </button>
      </div>

      {isUploading && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 elevation-1 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Upload New Document</h3>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
            <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX, or Images up to 20MB</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 elevation-1 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Document Name</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Last Modified</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
               { id: 1, name: "Employee Handbook 2026.pdf", category: "Policy", stage: "Printed", date: "Oct 24, 2026" },
               { id: 2, name: "Q3 Sales Report.xlsx", category: "Report", stage: "Viewed", date: "Oct 22, 2026" },
               { id: 3, name: "Client Vendor Contract.docx", category: "Contract", stage: "Sent", date: "Oct 20, 2026" },
               { id: 4, name: "Wireframe Assets.zip", category: "Other", stage: "Created", date: "Oct 19, 2026" },
            ].map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-slate-900">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">{doc.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold tracking-wide uppercase rounded-full border
                    ${doc.stage === 'Printed' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                    ${doc.stage === 'Viewed' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                    ${doc.stage === 'Sent' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                    ${doc.stage === 'Created' ? 'bg-slate-100 text-slate-700 border-slate-200' : ''}
                  `}>
                    {doc.stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {doc.date}
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button className="text-sm font-medium text-slate-400 group-hover:text-blue-600 transition-colors">View</button>
                  <button className="text-sm font-medium text-slate-400 group-hover:text-slate-700 transition-colors">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
