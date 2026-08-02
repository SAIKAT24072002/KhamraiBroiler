const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
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
    
    // Auto logout on unauthorized error
    if (error.response?.status === 401 && localStorage.getItem('kbc_token')) {
      localStorage.removeItem('kbc_token');
      window.location.href = '/login?expired=true';
    }

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
