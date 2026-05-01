"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { getEmployeeById, updateEmployee as updateEmployeeService } from "@/services/employeeService";
import EmployeeForm from "../../EmployeeForm";
import { ArrowLeft, UserCheck, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams();
  const user = useStore((state) => state.user);
  const { selectedEmployee, setSelectedEmployee, updateEmployee, loading: storeLoading, setLoading, error: storeError, setError } = useEmployeeStore();
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEmployeeById(id as string);
        setSelectedEmployee(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch employee details.");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchEmployee();
    }

    return () => setSelectedEmployee(null);
  }, [id, user, setSelectedEmployee, setLoading, setError]);

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    setError(null);
    try {
      const updatedEmployee = await updateEmployeeService(id as string, formData);
      updateEmployee(id as string, updatedEmployee);
      router.push("/employees");
    } catch (err: any) {
      setError(err.message || "Failed to update employee. Please try again.");
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Employee</h1>
          <p className="text-sm font-medium text-slate-500">Modify member details and platform permissions.</p>
        </div>
      </div>

      {storeLoading ? (
        <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center gap-4 border border-slate-100 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-slate-500 font-bold">Retrieving data...</p>
        </div>
      ) : storeError ? (
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center gap-6 border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Oops! Something went wrong</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">{storeError}</p>
          </div>
          <Link 
            href="/employees"
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Back to List
          </Link>
        </div>
      ) : selectedEmployee ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Update Profile</h3>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Editing: {selectedEmployee.name}</p>
            </div>
          </div>

          <EmployeeForm 
            defaultValues={selectedEmployee}
            onSubmit={handleSubmit}
            loading={submitting}
            error={storeError}
            submitLabel="Save Changes"
          />
        </div>
      ) : null}
    </div>
  );
}
