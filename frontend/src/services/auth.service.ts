import api from '@/lib/api';

export const authService = {
  register: (data: { name: string; email: string; phone: string; password: string; role?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string; loginType?: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: Record<string, string>) =>
    api.put('/auth/profile', data),
};
