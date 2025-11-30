import { apiClient } from './client';
import type { AuthUser } from './auth';

export interface User extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  list: async (): Promise<{ users: User[] }> => {
    const response = await apiClient.get('/api/users');
    return response.data;
  },

  get: async (id: string): Promise<{ user: User }> => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: { systemRoleCode: number | null }) => {
    const response = await apiClient.patch(`/api/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/users/${id}`);
    return response.data;
  },
};
