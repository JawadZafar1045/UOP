"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEmployeeStore } from "@/stores/employee.store";
import { EmployeeForm } from "@/components/employee/EmployeeForm";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NewEmployeePage() {
  const router = useRouter();
  const { createEmployee, isLoading, error } = useEmployeeStore();

  const handleSubmit = async (data: any) => {
    try {
      await createEmployee(data);
      router.push("/employee");
    } catch (err) {
      // Error handled by store
    }
  };

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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Employee</h1>
            <p className="text-slate-500 mt-1">Fill in the details to onboard a new team member.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <EmployeeForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel="Create Employee"
          />
        </div>
      </div>
    </div>
  );
}
