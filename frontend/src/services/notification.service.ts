import api from './api';

export const getNotifications = async () => {
  const res: any = await api.get('/notifications');
  return res?.data ?? res;
};

export const markAsRead = async (id: string) => {
  const res: any = await api.patch(`/notifications/${id}/read`);
  return res?.data ?? res;
};

export const markAllRead = async () => {
  const res: any = await api.patch('/notifications/read-all');
  return res?.data ?? res;
};
