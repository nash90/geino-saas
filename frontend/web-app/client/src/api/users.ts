import { apiClient } from './client';
import type { AuthUser } from './auth';
import type { PaginationParams } from '@/types/api';

export interface User extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  users: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get(`/api/users?${queryParams.toString()}`);
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
