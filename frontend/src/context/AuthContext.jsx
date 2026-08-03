import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('kbc_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('kbc_token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const loginWithPhone = async (mobile) => {
    try {
      const res = await api.post('/auth/login', { mobile });
      const { token, user: userData } = res.data;
      localStorage.setItem('kbc_token', token);
      setUser(userData);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('kbc_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithPhone, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
