import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setSettings(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load business settings:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update HTML Document Head dynamically
  useEffect(() => {
    if (settings) {
      document.title = `${settings.businessName} - ${settings.tagline}`;
      
      const faviconLink = document.getElementById('dynamic-favicon');
      if (faviconLink && settings.faviconUrl) {
        faviconLink.href = settings.faviconUrl;
      }
    }
  }, [settings]);

  const updateBranding = async (updatedData) => {
    try {
      const res = await api.put('/settings', updatedData);
      setSettings(res.data);
      return res.data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings: fetchSettings, updateBranding }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

// Dynamic Inline Premium SVG Logo fallback
export const LogoSvg = ({ className = "h-10 w-10" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={className} fill="none">
    {/* Background Circle Gradient */}
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    
    <circle cx="100" cy="100" r="90" fill="url(#logoGrad)" />
    
    {/* Stylized Golden Egg */}
    <path d="M75 140 C60 100 65 60 100 60 C135 60 140 100 125 140 C115 160 85 160 75 140 Z" fill="#fcd34d" opacity="0.9" />
    
    {/* Chicken Head Contour (White & Red Crest) */}
    <path d="M100 45 C115 45 130 55 125 75 C120 95 100 110 100 110 C100 110 80 95 75 75 C70 55 85 45 100 45 Z" fill="#ffffff" />
    <path d="M92 45 C95 32 105 32 108 45" fill="#ef4444" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
    <polygon points="100,75 106,85 94,85" fill="#f97316" /> {/* Beak */}
    
    {/* Sparkle/Quality Marks */}
    <path d="M145 60 L155 70 M155 60 L145 70" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
    <circle cx="100" cy="80" r="3" fill="#1e293b" /> {/* Eye */}
  </svg>
);
