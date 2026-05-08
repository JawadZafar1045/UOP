import api from './api';

export const getChatHistory = async (conversationId: string) => {
  const res = await api.get(`/communication/chat/${conversationId}`);
  return res.data;
};

export const sendEmail = async (data: any) => {
  const res = await api.post('/communication/email/send', data);
  return res.data;
};

export const getEmailLogs = async () => {
  const res = await api.get('/communication/email/logs');
  return res.data;
};
