import axios from 'axios';
import { prodError, devLog } from '@/lib/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log all API errors for monitoring
    prodError('API Request Failed:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: error.response?.data?.error || error.message,
    });

    // Don't retry for auth endpoints (login, register, refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/refresh') ||
                          originalRequest.url?.includes('/api/auth/login') ||
                          originalRequest.url?.includes('/api/auth/register');

    // If 401 and not an auth endpoint, try to refresh token
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // If already tried to retry this request, reject it
      if (originalRequest._retry) {
        devLog('Token refresh failed, redirecting to login');
        return Promise.reject(error);
      }

      // If currently refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/api/auth/refresh');
        devLog('Token refreshed successfully');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        prodError('Token refresh failed:', refreshError);
        processQueue(refreshError);
        // Refresh failed, redirect to login only if not on a public page
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicPage = publicPaths.some(path => window.location.pathname.includes(path));
        
        if (!isPublicPage) {
          devLog('Redirecting to login page');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
