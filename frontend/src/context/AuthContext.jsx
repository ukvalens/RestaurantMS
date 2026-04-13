import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('permissions')) || {}; } catch { return {}; }
  });
  const intervalRef = useRef(null);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/auth/permissions');
      setPermissions(res.data.permissions);
      localStorage.setItem('permissions', JSON.stringify(res.data.permissions));
    } catch {}
  };

  useEffect(() => {
    // Fetch immediately on load
    fetchPermissions();
    // Poll every 15s so permission changes from admin apply quickly
    intervalRef.current = setInterval(fetchPermissions, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const hasPermission = (perm) => {
    if (!user) return false;
    const rolePerms = permissions[user.role];
    if (!rolePerms) return true; // allow if not yet loaded
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
    // Fetch fresh permissions on login
    await fetchPermissions();
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    setToken(null);
    setUser(null);
    setPermissions({});
  };

  const updateUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const refreshPermissions = async () => {
    await fetchPermissions();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, permissions, hasPermission, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
