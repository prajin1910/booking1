import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
};

// Flights API
export const flightsAPI = {
  search: (searchParams) => api.get('/flights/search', { params: searchParams }),
  getById: (flightId) => api.get(`/flights/${flightId}`),
  getSeatMap: (flightId) => api.get(`/flights/${flightId}/seats`),
  getAirports: (search) => api.get('/flights/airports', { params: { search } }),
  getPopularDestinations: () => api.get('/flights/destinations/popular'),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings/create', bookingData),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getById: (bookingId) => api.get(`/bookings/${bookingId}`),
  cancel: (bookingId, reason) => api.put(`/bookings/${bookingId}/cancel`, { reason }),
  checkIn: (bookingId) => api.put(`/bookings/${bookingId}/checkin`),
  searchByPNR: (pnr) => api.get(`/bookings/search/pnr/${pnr}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getRecentBookings: () => api.get('/admin/recent-bookings'),
  getRecentUsers: () => api.get('/admin/recent-users'),
  
  // Flights management
  getFlights: (params) => api.get('/admin/flights', { params }),
  createFlight: (flightData) => api.post('/admin/flights', flightData),
  updateFlight: (flightId, flightData) => api.put(`/admin/flights/${flightId}`, flightData),
  deleteFlight: (flightId) => api.delete(`/admin/flights/${flightId}`),
  
  // Bookings management
  getBookings: (params) => api.get('/admin/bookings', { params }),
  
  // Users management
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
};

// Utility functions
export const formatError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isApiError = (error) => {
  return error.response && error.response.data;
};

export default api;