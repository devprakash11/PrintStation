import { request } from './api.js';

export const qrCodeService = {
  getAll() {
    return request('/qr-codes');
  },
  create(data) {
    return request('/qr-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  delete(id) {
    return request(`/qr-codes/${id}`, {
      method: 'DELETE',
    });
  },
};

export default qrCodeService;
