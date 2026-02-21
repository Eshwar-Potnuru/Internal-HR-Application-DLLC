import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  
  resetPassword: async (userId, newPassword) => {
    const response = await api.post('/api/auth/reset-password', { user_id: userId, new_password: newPassword });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};

export const employeesService = {
  getAll: (params) => api.get('/api/employees', { params }),
  getById: (id) => api.get(`/api/employees/${id}`),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  updateStatus: (id, status) => api.patch(`/api/employees/${id}/status`, { status })
};

export const attendanceService = {
  checkIn: () => api.post('/api/attendance/checkin'),
  checkOut: () => api.post('/api/attendance/checkout'),
  getAll: (params) => api.get('/api/attendance', { params }),
  getToday: () => api.get('/api/attendance/today')
};

export const leavesService = {
  create: (data) => api.post('/api/leaves', data),
  getAll: (params) => api.get('/api/leaves', { params }),
  approve: (id, comments) => api.patch(`/api/leaves/${id}/approve`, { comments }),
  reject: (id, comments) => api.patch(`/api/leaves/${id}/reject`, { comments }),
  uploadCertificate: (formData) => api.post('/api/leaves/upload-certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const salaryService = {
  create: (data) => api.post('/api/salary', data),
  getAll: (params) => api.get('/api/salary', { params }),
  getById: (id) => api.get(`/api/salary/${id}`),
  updateStatus: (id, status) => api.patch(`/api/salary/${id}/status`, { status })
};

export const documentsService = {
  upload: (formData) => api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/api/documents', { params }),
  delete: (id) => api.delete(`/api/documents/${id}`)
};

export const announcementsService = {
  create: (data) => api.post('/api/announcements', data),
  getAll: () => api.get('/api/announcements'),
  delete: (id) => api.delete(`/api/announcements/${id}`)
};

export const ticketsService = {
  create: (data) => api.post('/api/tickets', data),
  getAll: (params) => api.get('/api/tickets', { params }),
  updateStatus: (id, status) => api.patch(`/api/tickets/${id}/status`, { status })
};

export const auditLogsService = {
  getAll: (params) => api.get('/api/audit-logs', { params })
};

export const reportsService = {
  getAttendance: (params) => api.get('/api/reports/attendance', { params }),
  getLeaves: (params) => api.get('/api/reports/leaves', { params }),
  getEmployees: (params) => api.get('/api/reports/employees', { params })
};

export const cardsService = {
  getIdCard: (employeeId) => api.get(`/api/cards/id-card/${employeeId}`),
  getBusinessCard: (employeeId) => api.get(`/api/cards/business-card/${employeeId}`)
};

export const demoService = {
  loadUsers: () => api.post('/api/demo/load-users'),
  getUsers: () => api.get('/api/demo/users')
};

export const settingsService = {
  getAll: () => api.get('/api/settings'),
  getCategory: (category) => api.get(`/api/settings/${category}`),
  update: (category, settings) => api.put('/api/settings', { category, settings }),
  initialize: () => api.post('/api/settings/initialize')
};

export default api;