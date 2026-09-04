import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_UNAUTHORIZED_EVENT } from '../services/api.js';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const clearAuthenticatedState = useCallback(() => {
    authService.clearSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }

    try {
      const response = await authService.getMe();
      const currentUser = response?.data ?? null;
      if (!currentUser || currentUser.status === 'suspended') throw new Error('Session is no longer valid.');
      authService.saveSession(currentUser, token);
      setUser(currentUser);
      setStatus('authenticated');
      return currentUser;
    } catch {
      clearAuthenticatedState();
      return null;
    }
  }, [clearAuthenticatedState]);

  useEffect(() => {
    refreshUser();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearAuthenticatedState);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearAuthenticatedState);
  }, [refreshUser, clearAuthenticatedState]);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const currentUser = response?.data?.user;
    if (!currentUser) throw new Error('Login succeeded but no user session was returned.');
    setUser(currentUser);
    setStatus('authenticated');
    return response;
  }, []);

  const signup = useCallback(async (credentials) => {
    const response = await authService.signup(credentials);
    const currentUser = response?.data?.user;
    if (!currentUser) throw new Error('Account was created but no user session was returned.');
    setUser(currentUser);
    setStatus('authenticated');
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    signup,
    logout,
    refreshUser,
  }), [user, status, login, signup, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
