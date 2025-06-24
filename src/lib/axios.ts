import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '@clerk/clerk-react';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Custom hook to get authenticated axios instance
export const useAuthenticatedAxios = () => {
  const { getToken } = useAuth();

  // Add a request interceptor to add the auth token
  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // You can add logic here to refresh the token or redirect to login
      // For now, we'll just reject the promise
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 