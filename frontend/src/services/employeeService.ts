import api from './api';
import { Employee } from '../store/useEmployeeStore';

export const getEmployees = async () => {
  const res: any = await api.get('/employees');
  // Handle both { data: { employees: [] } } and { employees: [] }
  return res.data?.employees || res.employees || res;
};

export const getEmployeeById = async (id: string) => {
  const res: any = await api.get(`/employees/${id}`);
  return res.data?.employee || res.employee || res;
};

export const createEmployee = async (data: Partial<Employee>) => {
  const res: any = await api.post('/employees', data);
  return res.data?.employee || res.employee || res;
};

export const updateEmployee = async (id: string, data: Partial<Employee>) => {
  const res: any = await api.put(`/employees/${id}`, data);
  return res.data?.employee || res.employee || res;
};

export const deleteEmployee = async (id: string) => {
  const res: any = await api.delete(`/employees/${id}`);
  return res.data || res;
};
