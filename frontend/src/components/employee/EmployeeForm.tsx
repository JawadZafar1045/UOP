"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmployeeInput } from "@/types/employee.types";
import { User, Mail, Phone, Briefcase, Shield, Activity } from "lucide-react";

interface EmployeeFormProps {
  defaultValues?: EmployeeInput;
  onSubmit: (data: EmployeeInput) => void;
  isLoading: boolean;
  error: string | null;
  submitLabel: string;
}

const DEPARTMENTS = [
  { label: "Engineering", value: "Engineering" },
  { label: "Sales", value: "Sales" },
  { label: "Marketing", value: "Marketing" },
  { label: "Human Resources", value: "Human Resources" },
  { label: "Finance", value: "Finance" },
  { label: "Operations", value: "Operations" },
  { label: "Design", value: "Design" },
  { label: "Legal", value: "Legal" },
  { label: "Customer Support", value: "Customer Support" },
];

const ROLES = [
  { label: "Admin", value: "Admin" },
  { label: "Manager", value: "Manager" },
  { label: "Employee", value: "Employee" },
  { label: "Student", value: "Student" },
];

const STATUSES = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading,
  error,
  submitLabel,
}) => {
  const [formData, setFormData] = useState<EmployeeInput>(
    defaultValues || {
      name: "",
      email: "",
      phone: "",
      department: "Engineering",
      role: "Employee",
      status: "Active",
    }
  );

  useEffect(() => {
    if (defaultValues) {
      setFormData(defaultValues);
    }
  }, [defaultValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-600 flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-bold">!</div>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
          icon={User}
          required
        />
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john@company.com"
          icon={Mail}
          required
        />
        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 234 567 890"
          icon={Phone}
          required
        />
        <Select
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          options={DEPARTMENTS}
          required
        />
        <Select
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          options={ROLES}
          required
        />
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={STATUSES}
          required
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full md:w-auto min-w-[160px]"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
