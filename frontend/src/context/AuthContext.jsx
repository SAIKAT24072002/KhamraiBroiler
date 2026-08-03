import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { firebaseAuth, setupRecaptcha } from '../firebase';
import { signInWithPhoneNumber } from 'firebase/auth';

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
      // Ensure reCAPTCHA is ready
      const verifier = setupRecaptcha();
      // Firebase expects phone number with country code, e.g., +91XXXXXXXXXX
      const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;
      // Initiate sign-in with phone number
      const confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedMobile, verifier);
      // Store globally for later verification
      window.confirmationResult = confirmationResult;
      return { message: 'OTP sent via Firebase' };
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const verifyOtp = async (mobile, otp, name = '', email = '') => {
    try {
      if (!window.confirmationResult) {
        throw new Error('OTP not requested. Please request OTP first.');
      }
      // Confirm the OTP with Firebase
      const userCredential = await window.confirmationResult.confirm(otp);
      const user = userCredential.user;
      
      // Retrieve Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send Firebase token and user details to our backend to sync and get backend JWT
      const res = await api.post('/auth/verify-otp', {
        idToken,
        mobile,
        name,
        email
      });
      
      const { token: backendToken, user: userData } = res.data;
      
      // Store our backend JWT locally for authenticated requests
      localStorage.setItem('kbc_token', backendToken);
      setToken(backendToken);
      setUser(userData);
      
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
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
