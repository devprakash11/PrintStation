import { request } from './api.js';

export const userService = {
  getAll() {
    return request('/users');
  },
  create(data) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id, data) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export default userService;
