import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kbc_token') || null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.warn('Profile fetch failed (not logged in):', err.message);
      // Clean stale token if profile fetch fails
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const sendOtp = async (mobile) => {
    try {
      const res = await api.post('/auth/send-otp', { mobile });
      return res.data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const verifyOtp = async (mobile, otp, name = '', email = '') => {
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp, name, email });
      const { token: jwtToken, user: userData } = res.data;
      
      localStorage.setItem('kbc_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return res.data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('kbc_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/me', profileData);
      setUser(res.data);
      return res.data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const hasRole = (roles = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has absolute permission
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOtp,
        verifyOtp,
        logout,
        updateProfile,
        hasRole,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
