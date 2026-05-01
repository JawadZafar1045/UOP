import axiosInstance from "@/lib/axios";
import { Employee, EmployeeInput } from "@/types/employee.types";

export const getEmployees = async () => {
  const res = await axiosInstance.get("/api/employee");
  return res.data.employees || res.data;
};

export const getEmployeeById = async (id: string) => {
  const res = await axiosInstance.get(`/api/employee/${id}`);
  return res.data.employee || res.data;
};

export const createEmployee = async (data: EmployeeInput) => {
  const res = await axiosInstance.post("/api/employee", data);
  return res.data.employee || res.data;
};

export const updateEmployee = async (id: string, data: EmployeeInput) => {
  const res = await axiosInstance.put(`/api/employee/${id}`, data);
  return res.data.employee || res.data;
};

export const deleteEmployee = async (id: string) => {
  const res = await axiosInstance.delete(`/api/employee/${id}`);
  return res.data;
};
