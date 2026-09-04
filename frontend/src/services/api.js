const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const SESSION_KEY = 'printstation_admin_session';
export const TOKEN_KEY = 'printstation_admin_token';
export const AUTH_UNAUTHORIZED_EVENT = 'printstation:auth-unauthorized';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...options.headers };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    const message =
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors.map((error) => error.message || error).join(', ') : null) ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default {
  request,
  API_BASE,
  SESSION_KEY,
  TOKEN_KEY,
  AUTH_UNAUTHORIZED_EVENT,
};
