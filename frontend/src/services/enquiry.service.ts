import api from '@/lib/api';

export const enquiryService = {
  submit: (data: { type: string; name: string; phone: string; email?: string; message: string; product?: string; startupKit?: string }) =>
    api.post('/enquiries', data),
};
