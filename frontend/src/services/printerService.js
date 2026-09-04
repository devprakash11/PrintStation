import { request } from './api.js';

export const printerService = {
  getAll() {
    return request('/printers');
  },
  create(data) {
    return request('/printers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id, data) {
    return request(`/printers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete(id) {
    return request(`/printers/${id}`, {
      method: 'DELETE',
    });
  },
};

export default printerService;
