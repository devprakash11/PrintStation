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

  uploadFiles(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    return request('/uploads', {
      method: 'POST',
      body: formData,
    });
  },
};

export default printJobService;
