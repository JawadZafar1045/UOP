"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEmployeeStore } from "@/stores/employee.store";
import { EmployeeForm } from "@/components/employee/EmployeeForm";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams();
  const { 
    selectedEmployee, 
    getEmployee, 
    updateEmployee, 
    isLoading, 
    error 
  } = useEmployeeStore();

  useEffect(() => {
    if (id) {
      getEmployee(id as string);
    }
  }, [id, getEmployee]);

  const handleSubmit = async (data: any) => {
    try {
      await updateEmployee(id as string, data);
      router.push("/employee");
    } catch (err) {
      // Error handled by store
    }
  };

  if (isLoading && !selectedEmployee) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-12 w-32 ml-auto rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            icon={ArrowLeft}
            onClick={() => router.push("/employee")}
          />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Employee</h1>
            <p className="text-slate-500 mt-1">Update the profile and permissions for this team member.</p>
          </div>
        </div>

        {!selectedEmployee && !isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Employee not found</h3>
            <p className="text-slate-500 mt-1">The employee record you are trying to edit does not exist or has been removed.</p>
            <Button variant="outline" className="mt-6" onClick={() => router.push("/employee")}>
              Back to List
            </Button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <EmployeeForm
              defaultValues={selectedEmployee ? {
                name: selectedEmployee.name,
                email: selectedEmployee.email,
                phone: selectedEmployee.phone,
                department: selectedEmployee.department,
                role: selectedEmployee.role,
                status: selectedEmployee.status,
              } : undefined}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              submitLabel="Save Changes"
            />
          </div>
        )}
      </div>
    </div>
  );
}
