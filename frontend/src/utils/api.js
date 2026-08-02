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

export default api;
export { baseApiUrl };
