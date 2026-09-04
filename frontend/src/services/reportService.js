import { request } from './api.js';

export const reportService = {
  getOverview() {
    return request('/reports/overview');
  },
};

export default reportService;
