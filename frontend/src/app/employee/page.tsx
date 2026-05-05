"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeStore } from "@/stores/employee.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import {
  Plus, Search, Edit2, Trash2, Mail, Phone,
  Briefcase, User, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";

export default function EmployeeListPage() {
  const router = useRouter();
  const { employees, isLoading, error, getEmployees, deleteEmployee } = useEmployeeStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getEmployees();
  }, [getEmployees]);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(deleteId);
      setDeleteId(null);
    } catch (err) {
      // Error is handled by store
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Employees</h1>
            <p className="text-slate-500 mt-1 text-lg">Manage your team members and their organizational details.</p>
          </div>
          <Button
            onClick={() => router.push("/employee/new")}
            icon={Plus}
            className="md:w-auto"
          >
            Add Employee
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <Input
            placeholder="Search by name, email or department..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white border-slate-200"
          />
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading && employees.length === 0 ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Failed to load employees</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">{error}</p>
              <Button variant="outline" className="mt-6" onClick={() => getEmployees()}>
                Try Again
              </Button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No employees found</h3>
              <p className="text-slate-500 mt-1">
                {searchTerm ? `No results matching "${searchTerm}"` : "Get started by adding your first employee."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-400">ID: {emp._id.slice(-6).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" /> {emp.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="w-4 h-4 text-slate-300" /> {emp.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Briefcase className="w-4 h-4 text-slate-300" /> {emp.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={emp.role === 'Admin' ? 'info' : 'default'}>
                          {emp.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={emp.status === 'Active' ? 'success' : 'default'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={Edit2}
                            onClick={() => router.push(`/employee/${emp._id}/edit`)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={Trash2}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(emp._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Employee"
        description="Are you sure you want to delete this employee? This action cannot be undone."
      >
        <div className="flex flex-col gap-3">
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="w-full"
          >
            Confirm Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteId(null)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
