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

  getPublic(token) {
    if (!token) throw new Error('QR token is required.');
    return request(`/qr-codes/public/${encodeURIComponent(token)}`);
  },

  delete(id) {
    return request(`/qr-codes/${id}`, {
      method: 'DELETE',
    });
  },
};

export default qrCodeService;
