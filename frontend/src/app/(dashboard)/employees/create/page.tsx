"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { createEmployee } from "@/services/employeeService";
import EmployeeForm from "../EmployeeForm";
import { ArrowLeft, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CreateEmployeePage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const addEmployee = useEmployeeStore((state) => state.addEmployee);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newEmployee = await createEmployee({
        ...formData,
        tenantId: user?.tenantId || "default"
      });
      addEmployee(newEmployee);
      router.push("/employees");
    } catch (err: any) {
      setError(err.message || "Failed to create employee. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/employees"
          className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add New Employee</h1>
          <p className="text-sm font-medium text-slate-500">Enter employee details to grant workspace access.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Personal Information</h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Required Fields</p>
          </div>
        </div>

        <EmployeeForm 
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          submitLabel="Create Employee Record"
        />
      </div>

      <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <ArrowRight className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Pro Tip</h4>
          <p className="text-blue-700/80 text-sm leading-relaxed mt-1">
            Newly created employees will receive an automated invitation email to set their password and access the Unified Operations Platform.
          </p>
        </div>
      </div>
    </div>
  );
}
