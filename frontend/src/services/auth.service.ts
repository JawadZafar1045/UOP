import api from './api';

export const verifyEmail = async (data: { email: string; code: string; tenantId: string }) => {
  const res = await api.post('/auth/verify-email', data);
  return res.data;
};

export const updateProfile = async (data: { 
  name?: string; 
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
}) => {
  const res = await api.patch('/auth/profile', data);
  return res.data;
};

export const updatePassword = async (data: { currentPwd?: string; newPwd?: string }) => {
  const res = await api.patch('/auth/password', data);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
