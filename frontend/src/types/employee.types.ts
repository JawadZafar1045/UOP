export interface Employee {
  _id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: "Admin" | "Manager" | "Employee" | "Student";
  status: "Active" | "Inactive";
  createdAt?: string;
}
export type EmployeeInput = Omit<Employee, "_id" | "tenantId" | "createdAt">;
