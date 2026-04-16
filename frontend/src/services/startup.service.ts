import api from '@/lib/api';

export const startupService = {
  getKits: () => api.get('/startup-kits'),

  getKit: (id: string) => api.get(`/startup-kits/${id}`),

  submitApplication: (data: Record<string, string>) =>
    api.post('/startup-applications', data),

  getMyApplications: () => api.get('/startup-applications/my'),
};
