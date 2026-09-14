import { request } from './api.js';

export const reportService = {
  getOverview() {
    return request('/reports/summary');
  },
};

export default reportService;
