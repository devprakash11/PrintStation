import { request } from './api.js';

export const agentService = {
  getAll() {
    return request('/agents');
  },

  createPairingCode() {
    return request('/agents/pairing-codes', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  update(id, data) {
    return request(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export default agentService;
