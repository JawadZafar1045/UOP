"use client";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage team members and HR records.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Filter employees..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all elevation-1">
            + Add Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 elevation-1 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Join Date</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((emp) => (
              <tr key={emp} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 text-sm">
                      E{emp}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Jane Doe {emp}</p>
                      <p className="text-xs text-slate-500 mt-0.5">jane.doe{emp}@uop.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-900 font-medium">Engineering</p>
                  <p className="text-xs text-slate-500 mt-0.5">Senior Developer</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  Oct 12, 2024
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm font-medium text-slate-400 group-hover:text-blue-600 transition-colors">Edit profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
