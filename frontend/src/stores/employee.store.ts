import { create } from "zustand";
import { Employee, EmployeeInput } from "@/types/employee.types";
import * as employeeService from "@/services/employee.service";

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
  getEmployees: () => Promise<void>;
  getEmployee: (id: string) => Promise<void>;
  createEmployee: (data: EmployeeInput) => Promise<void>;
  updateEmployee: (id: string, data: EmployeeInput) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,

  getEmployees: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await employeeService.getEmployees();
      set({ employees: data, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Something went wrong";
      set({ error: message, isLoading: false });
    }
  },

  getEmployee: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await employeeService.getEmployeeById(id);
      set({ selectedEmployee: data, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Something went wrong";
      set({ error: message, isLoading: false });
    }
  },

  createEmployee: async (data: EmployeeInput) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.createEmployee(data);
      set({ isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Something went wrong";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateEmployee: async (id: string, data: EmployeeInput) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.updateEmployee(id, data);
      set({ isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Something went wrong";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteEmployee: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.deleteEmployee(id);
      set((state) => ({
        employees: state.employees.filter((emp) => emp._id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Something went wrong";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
