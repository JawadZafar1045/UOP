import api from './api';
import axios from 'axios';
import { useStore } from '../store/useStore';

export const getDocuments = async (params: any = {}) => {
  const res: any = await api.get('/documents', { params });
  return res.data;
};

export const uploadDocument = async (formData: FormData) => {
  const res: any = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const deleteDocument = async (id: string) => {
  const res: any = await api.delete(`/documents/${id}`);
  return res.data;
};

export const downloadDocument = async (id: string, fileName: string) => {
  const token = useStore.getState().accessToken;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // Use raw axios (not the custom api instance) to avoid the response interceptor
  // which strips response.data and breaks blob handling
  const response = await axios.get(`${baseURL}/documents/${id}/access`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

  const blob = response.data;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
