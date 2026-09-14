import { request, SESSION_KEY, TOKEN_KEY } from './api.js';

export const authService = {
  async login({ email, password }) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res?.data?.token && res?.data?.user) {
      authService.saveSession(res.data.user, res.data.token);
    }

    return res;
  },

  async getMe() {
    return request('/auth/me');
  },

  async logout() {
    authService.clearSession();
  },

  saveSession(user, token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        }),
      );
    }
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};

export default authService;
