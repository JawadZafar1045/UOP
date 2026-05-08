import api from './api';

export const updateProfile = async (data: { name: string; avatar?: string }) => {
  const res = await api.patch('/auth/profile', data);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
