import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('permissions')) || {}; } catch { return {}; }
  });

  useEffect(() => {
    api.get('/auth/permissions').then(res => {
      setPermissions(res.data.permissions);
      localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
    }).catch(() => {});
  }, []);

  const hasPermission = (perm) => {
    if (!user) return false;
    const rolePerms = permissions[user.role];
    if (!rolePerms) return true; // fallback: allow if no config loaded yet
    return rolePerms.includes(perm);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', {
      email: email?.trim().toLowerCase(),
      password: password?.trim()
    });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const refreshPermissions = async () => {
    const res = await api.get('/auth/permissions');
    setPermissions(res.data.permissions);
    localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, permissions, hasPermission, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
