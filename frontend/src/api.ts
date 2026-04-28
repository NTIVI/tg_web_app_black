import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://tg-web-app-black.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
});

export const authApi = {
  login: (telegramId: string, firstName?: string, lastName?: string) =>
    api.post('/auth/login', { telegramId, firstName, lastName }),
};

export const userApi = {
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  uploadPhotos: (id: string, photos: any[]) => api.post(`/users/${id}/photos`, { photos }),
  getFeed: (userId: string) => api.get(`/feed/${userId}`),
  getChats: (userId: string) => api.get(`/users/${userId}/chats`),
  claimDailyBonus: (userId: string) => api.post(`/users/${userId}/claim-daily`),
};

export const likeApi = {
  like: (fromUserId: string, toUserId: string) =>
    api.post('/likes', { fromUserId, toUserId }),
};

export const chatApi = {
  sendMessage: (chatId: string, senderId: string, text: string) =>
    api.post(`/chats/${chatId}/messages`, { senderId, text }),
  getMessages: (chatId: string, userId: string) =>
    api.get(`/chats/${chatId}/messages?userId=${userId}`),
  setTyping: (chatId: string, userId: string) =>
    api.post(`/chats/${chatId}/typing`, { userId }),
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  blockUser: (id: string, isBlocked: boolean) =>
    api.post(`/admin/users/${id}/block`, { isBlocked }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  deletePhoto: (id: string) => api.delete(`/admin/photos/${id}`),
  adjustStats: (id: string, level: number, coins: number) =>
    api.post(`/admin/users/${id}/adjust`, { level, coins }),
};

export const newsApi = {
  getNews: () => api.get('/news'),
  createNews: (data: { title: string; content: string; imageUrl?: string }) => api.post('/admin/news', data),
  updateNews: (id: string, data: { title: string; content: string; imageUrl?: string }) => api.put(`/admin/news/${id}`, data),
  deleteNews: (id: string) => api.delete(`/admin/news/${id}`),
};

export default api;
