import api from '@/lib/api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),

  getUsers: (params?: Record<string, string | number>) => api.get('/admin/users', { params }),

  getOrders: (params?: Record<string, string | number>) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, data: Record<string, string>) => api.put(`/admin/orders/${id}/status`, data),

  getApplications: (params?: Record<string, string | number>) => api.get('/admin/startup-applications', { params }),
  updateApplication: (id: string, data: Record<string, string>) => api.put(`/admin/startup-applications/${id}`, data),

  getProviders: (params?: Record<string, string | number>) => api.get('/admin/providers', { params }),
  approveProvider: (id: string, data: Record<string, unknown>) => api.put(`/admin/providers/${id}/approve`, data),

  getJobs: (params?: Record<string, string | number>) => api.get('/admin/jobs', { params }),
  createJob: (data: Record<string, unknown>) => api.post('/admin/jobs', data),

  getEnquiries: (params?: Record<string, string | number>) => api.get('/admin/enquiries', { params }),
  updateEnquiry: (id: string, data: Record<string, boolean>) => api.put(`/admin/enquiries/${id}`, data),

  getCommissions: () => api.get('/admin/commissions'),
  createCommission: (data: Record<string, unknown>) => api.post('/admin/commissions', data),
  updateCommission: (id: string, data: Record<string, unknown>) => api.put(`/admin/commissions/${id}`, data),
};
