import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

export const authApi = {
  login: (telegramId: string, firstName?: string, lastName?: string) =>
    api.post('/auth/login', { telegramId, firstName, lastName }),
};

export const userApi = {
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  uploadPhotos: (id: string, photos: any[]) => api.post(`/users/${id}/photos`, photos),
  getFeed: (userId: string) => api.get(`/feed/${userId}`),
  getChats: (userId: string) => api.get(`/users/${userId}/chats`),
};

export const likeApi = {
  like: (fromUserId: string, toUserId: string) =>
    api.post('/likes', { fromUserId, toUserId }),
};

export const chatApi = {
  sendMessage: (chatId: string, senderId: string, text: string) =>
    api.post(`/chats/${chatId}/messages`, { senderId, text }),
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  blockUser: (id: string, isBlocked: boolean) =>
    api.post(`/admin/users/${id}/block`, { isBlocked }),
};

export default api;
