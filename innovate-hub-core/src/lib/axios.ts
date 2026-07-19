import axios from 'axios';

import { API_BASE_URL } from './api';

// Create axios instance with baseURL and credentials
const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for sending cookies
});

// Add a request interceptor to include the auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('idea_hub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors to avoid console noise
    if (error.response?.status !== 401) {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
