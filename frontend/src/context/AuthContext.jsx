import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearCsrfToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback(async credentials => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async details => {
    const { data } = await api.post('/auth/register', details);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async details => {
    const { data } = await api.patch('/auth/me', details);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); }
    finally { clearCsrfToken(); setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, updateProfile, logout, refreshUser }), [user, loading, login, register, updateProfile, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
