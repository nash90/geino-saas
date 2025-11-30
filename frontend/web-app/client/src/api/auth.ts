import { apiClient } from './client';

export interface RegisterData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  systemRoleCode: number | null;
}

export interface LoginResponse {
  user: AuthUser;
  organizations: any[];
  projects: any[];
}

export interface SessionResponse {
  user: AuthUser;
  organizations: any[];
  projects: any[];
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post('/api/auth/refresh');
    return response.data;
  },

  getSession: async (): Promise<SessionResponse> => {
    const response = await apiClient.get('/api/auth/session');
    return response.data;
  },

  resetPassword: async (email: string) => {
    const response = await apiClient.post('/api/auth/reset-password', { email });
    return response.data;
  },

  updatePassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/api/auth/update-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};
