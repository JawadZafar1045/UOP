import { create } from 'zustand';

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Student';
  status: 'Active' | 'Inactive';
  tenantId: string;
}

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  setEmployees: (employees: Employee[]) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  setEmployees: (employees) => set({ employees, error: null }),
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  addEmployee: (employee) => set((state) => ({ employees: [employee, ...state.employees] })),
  updateEmployee: (id, updatedData) => set((state) => ({
    employees: state.employees.map((emp) => emp._id === id ? { ...emp, ...updatedData } : emp)
  })),
  removeEmployee: (id) => set((state) => ({
    employees: state.employees.filter((emp) => emp._id !== id)
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
