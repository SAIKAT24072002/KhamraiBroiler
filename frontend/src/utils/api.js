let baseApiUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
// Dynamically replace localhost with the actual IP if accessed from a mobile phone on LAN
if (baseApiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
  baseApiUrl = baseApiUrl.replace('localhost', window.location.hostname);
}
import axios from 'axios';

const api = axios.create({
  baseURL: baseApiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kbc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong. Please check your connection.';
    
    // Auth has been removed, so we do not redirect to /login on 401

    return Promise.reject(new Error(message));
  }
);

/**
 * Resolves image URLs that may be relative (from local disk storage)
 * to absolute URLs using the backend base URL.
 * Cloudinary URLs (absolute) pass through unchanged.
 */
const backendBaseUrl = baseApiUrl.replace(/\/api\/?$/, '');
const resolveImageUrl = (url) => {
  if (!url) return '';
  // Already an absolute URL (Cloudinary or external)
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative URL from local disk storage - prepend backend base
  if (url.startsWith('/uploads/')) return `${backendBaseUrl}${url}`;
  return url;
};

export default api;
export { baseApiUrl, resolveImageUrl };
