import axios from 'axios';

const API_BASE = 'https://hms-vsku.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout
});

// Attach JWT token from sessionStorage to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  const tokenExpiry = sessionStorage.getItem('tokenExpiry');

  // Check if token is expired before making the request
  if (token && tokenExpiry) {
    const expiryTime = parseInt(tokenExpiry, 10);
    if (Date.now() >= expiryTime) {
      // Token expired — clear session and redirect
      sessionStorage.clear();
      window.location.href = '/login';
      return Promise.reject(new Error('Token expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Check if server indicates token is expired via custom header
    if (response.headers['x-token-expired'] === 'true') {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Check for token expiry header on error responses
      if (error.response.headers['x-token-expired'] === 'true') {
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized — session invalid
      if (status === 401) {
        const currentPath = window.location.pathname;
        // Don't redirect if already on login/register page
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }

      // Handle 403 Forbidden — insufficient permissions
      if (status === 403) {
        console.error('Access denied: Insufficient permissions. Check if your role is correct or try logging out and back in.');
      }
      console.error(`API Error [${status}]:`, error.response.data);
    } else {
      console.error('Network Error or No Response:', error.message);
    }

    return Promise.reject(error);
  }
);

console.log('API Base URL:', API_BASE);

// ====== AUTH ======
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  validateToken: () => api.get('/auth/validate'),
  getDoctors: () => api.get('/auth/doctors'),
  searchDoctors: (query, type) => api.get(`/auth/doctors/search?query=${query}&type=${type}`),
  getDoctorById: (id) => api.get(`/auth/doctors/${id}`),
};

// ====== PATIENT ======
export const patientAPI = {
  getDoctors: () => api.get('/patient/doctors'),
  searchDoctors: (query, type) => api.get(`/patient/doctors/search?query=${query}&type=${type}`),
  getDoctorById: (id) => api.get(`/patient/doctors/${id}`),
  bookAppointment: (data) => api.post('/patient/appointments', data),
  getAppointments: () => api.get('/patient/appointments'),
  cancelAppointment: (id) => api.patch(`/patient/appointments/${id}/cancel`),
};

// ====== DOCTOR ======
export const doctorAPI = {
  getAppointments: () => api.get('/doctor/appointments'),
  getAppointmentsByDate: (date) => api.get(`/doctor/appointments/date?date=${date}`),
  confirmAppointment: (id) => api.patch(`/doctor/appointments/${id}/confirm`),
  completeAppointment: (id) => api.patch(`/doctor/appointments/${id}/complete`),
  addSlot: (data) => api.post('/doctor/slots', data),
  getSlots: () => api.get('/doctor/slots'),
  removeSlot: (id) => api.delete(`/doctor/slots/${id}`),
};

// ====== ADMIN ======
export const adminAPI = {
  getAppointments: () => api.get('/admin/appointments'),
  cancelAppointment: (id) => api.patch(`/admin/appointments/${id}/cancel`),
  getAppointmentsPerDoctor: () => api.get('/admin/reports/appointments-per-doctor'),
  getRevenuePerDepartment: () => api.get('/admin/reports/revenue-per-department'),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  getDoctors: () => api.get('/admin/doctors'),
};

export default api;
