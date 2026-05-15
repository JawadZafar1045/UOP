import api from './api';

export const getDashboardStats = async () => {
  const res = await api.get('/dashboard');
  return res.data;
};

export const getActivities = async () => {
  const res = await api.get('/dashboard/activities');
  return res.data;
};
