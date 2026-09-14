import { request } from './api.js';

export const printJobService = {
  getAll() {
    return request('/print-jobs');
  },

  create(data) {
    return request('/print-jobs/public', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancel(id) {
    return request(`/print-jobs/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  async uploadFiles(files) {
    return Promise.all(
      Array.from(files || []).map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request('/uploads', {
          method: 'POST',
          body: formData,
        });
      }),
    );
  },
};

export default printJobService;
