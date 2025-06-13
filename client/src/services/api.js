import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const authData = localStorage.getItem('optima-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data
      localStorage.removeItem('optima-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (updates) => api.put('/auth/profile', updates),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

// Chat API
export const chatAPI = {
  // Sessions
  createSession: (data) => api.post('/chat/sessions', data),
  getSessions: (params = {}) => api.get('/chat/sessions', { params }),
  getSession: (sessionId) => api.get(`/chat/sessions/${sessionId}`),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
  
  // Messages
  sendMessage: (data) => api.post('/chat/message', data),
};

// OCR API
export const ocrAPI = {
  uploadReceipt: (file, sessionId) => {
    const formData = new FormData();
    formData.append('receipt', file);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    return api.post('/ocr/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for OCR processing
    });
  },
  
  getOcrResult: (fileId) => api.get(`/ocr/result/${fileId}`),
};

// PDF API
export const pdfAPI = {
  generate: (data) => api.post('/pdf/generate', data),
  download: (id) => api.get(`/pdf/download/${id}`, {
    responseType: 'blob',
  }),
};

// Generic API utilities
export const apiUtils = {
  // Handle file download from blob response
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  
  // Format API errors for display
  formatError: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Ein unbekannter Fehler ist aufgetreten';
  },
  
  // Check if response is successful
  isSuccess: (response) => {
    return response.status >= 200 && response.status < 300;
  },
};

export default api;